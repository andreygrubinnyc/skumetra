import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { __resetRateLimiterForTests } from '@/lib/security/rate-limiter'
import { __resetFallbackStoreForTests } from '@/lib/services/pilot-application-fallback-store'

// Mock the Supabase client factory so tests control which code path runs
// (fallback store vs. real-Supabase) without any real credentials.
const getServerSupabaseClientMock = vi.hoisted(() => vi.fn(() => null as unknown))
vi.mock('@/lib/supabase/server-client', () => ({
  getServerSupabaseClient: getServerSupabaseClientMock,
}))

const captureServerErrorMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/monitoring/error-reporting', () => ({
  captureServerError: captureServerErrorMock,
}))

import { POST } from './route'

const validApplication = {
  name: 'Jordan Reyes',
  email: 'jordan@example.com',
  business: 'Northline Supply Co.',
  selling: 'yes',
  listings: '101-500',
  suppliers: '2-3',
  format: 'csv',
  problem: 'stockouts',
  files: 'real',
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request('http://localhost/api/pilot-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.1', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

describe('POST /api/pilot-application', () => {
  beforeEach(() => {
    __resetRateLimiterForTests()
    __resetFallbackStoreForTests()
    getServerSupabaseClientMock.mockReturnValue(null)
    captureServerErrorMock.mockClear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('inserts via the fallback store and returns ok:true when no Supabase is configured', async () => {
    const res = await post(validApplication)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.id).toMatch(/^pilot_fallback_/)
  })

  it('rejects an invalid application with a generic 400', async () => {
    const res = await post({ ...validApplication, email: 'not-an-email' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ ok: false, error: 'Please check your information and try again.' })
  })

  it('rejects malformed JSON with a generic 400', async () => {
    const res = await post('{not json')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.ok).toBe(false)
  })

  it('rejects an oversized body with 413', async () => {
    const res = await post({ ...validApplication, comments: 'x'.repeat(20_000) })
    expect(res.status).toBe(413)
  })

  describe('honeypot', () => {
    it('responds with a fake success and does not store the application', async () => {
      const res = await post({ ...validApplication, honeypot: 'http://spam.example' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)

      // Confirm nothing was actually stored: submitting the SAME email for
      // real afterward should not be treated as a duplicate.
      const real = await post(validApplication)
      const realBody = await real.json()
      expect(realBody.id).not.toBe(body.id)
      expect(realBody.id).toMatch(/^pilot_fallback_/)
    })

    it('logs the attempt server-side', async () => {
      await post({ ...validApplication, honeypot: 'http://spam.example' })
      expect(captureServerErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ route: 'api/pilot-application' }),
      )
    })
  })

  describe('duplicate / soft rate limit by email', () => {
    it('returns the existing id instead of inserting a second row', async () => {
      const first = await post(validApplication)
      const firstBody = await first.json()

      const second = await post(validApplication)
      const secondBody = await second.json()

      expect(secondBody).toEqual({ ok: true, id: firstBody.id })
    })
  })

  describe('rate limiting', () => {
    it('allows the configured number of requests then rejects with 429', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await post({ ...validApplication, email: `user${i}@example.com` })
        expect(res.status).toBe(200)
      }
      const limited = await post({ ...validApplication, email: 'user5@example.com' })
      expect(limited.status).toBe(429)
    })

    it('tracks limits per IP independently', async () => {
      for (let i = 0; i < 5; i++) {
        await post({ ...validApplication, email: `user${i}@example.com` })
      }
      const otherIp = await post(
        { ...validApplication, email: 'someone-else@example.com' },
        { 'x-forwarded-for': '198.51.100.9' },
      )
      expect(otherIp.status).toBe(200)
    })
  })

  describe('with a real (mocked) Supabase client configured', () => {
    it('inserts via the repository and returns its id', async () => {
      const client = {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'real-row-1' }, error: null }),
            }),
          }),
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }
      getServerSupabaseClientMock.mockReturnValue(client)

      const res = await post(validApplication)
      const body = await res.json()
      expect(body).toEqual({ ok: true, id: 'real-row-1' })
    })

    it('returns a generic 500 and logs the real error when the insert fails', async () => {
      const client = {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'connection refused' } }),
            }),
          }),
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }
      getServerSupabaseClientMock.mockReturnValue(client)

      const res = await post(validApplication)
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body).toEqual({ ok: false, error: 'Something went wrong sending your application. Please try again.' })
      expect(captureServerErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'connection refused' }),
        expect.objectContaining({ route: 'api/pilot-application' }),
      )
    })
  })
})

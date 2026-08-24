import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitPilotApplication } from './pilot-submission'
import type { PilotApplication } from '@/types/pilot'

const application: PilotApplication = {
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

function mockFetchOnce(body: unknown, init: ResponseInit = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), init)),
  )
}

describe('submitPilotApplication', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts to /api/pilot-application with the application as JSON', async () => {
    mockFetchOnce({ ok: true, id: 'abc-123' })
    await submitPilotApplication(application)

    expect(fetch).toHaveBeenCalledWith(
      '/api/pilot-application',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      }),
    )
  })

  it('resolves with an id on success', async () => {
    mockFetchOnce({ ok: true, id: 'abc-123' })
    const result = await submitPilotApplication(application)
    expect(result).toEqual({ ok: true, id: 'abc-123' })
  })

  it('resolves with the server-provided error on a failed response', async () => {
    mockFetchOnce({ ok: false, error: 'Please check your information and try again.' }, { status: 400 })
    const result = await submitPilotApplication(application)
    expect(result).toEqual({ ok: false, error: 'Please check your information and try again.' })
  })

  it('resolves with a generic error when the network request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const result = await submitPilotApplication(application)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/something went wrong/i)
  })

  it('resolves with a generic error when the response body is not valid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 200 })))
    const result = await submitPilotApplication(application)
    expect(result.ok).toBe(false)
  })

  it('resolves with a generic error when the response shape is unexpected', async () => {
    mockFetchOnce({ unexpected: 'shape' })
    const result = await submitPilotApplication(application)
    expect(result.ok).toBe(false)
  })
})

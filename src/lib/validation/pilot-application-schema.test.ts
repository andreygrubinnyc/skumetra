import { describe, it, expect } from 'vitest'
import { pilotApplicationSchema } from './pilot-application-schema'

const valid = {
  name: 'Jordan Reyes',
  email: 'jordan@northline.com',
  business: 'Northline Supply Co.',
  selling: 'yes',
  listings: '101-500',
  suppliers: '2-3',
  format: 'csv',
  problem: 'stockouts',
  files: 'real',
  comments: 'Two suppliers, mostly electronics.',
}

describe('pilotApplicationSchema', () => {
  it('accepts a complete, valid application', () => {
    const result = pilotApplicationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('treats comments as optional', () => {
    const { comments, ...rest } = valid
    void comments
    expect(pilotApplicationSchema.safeParse(rest).success).toBe(true)
  })

  it('rejects a missing/short name', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, name: 'J' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toMatch(/full name/i)
    }
  })

  it('rejects an invalid email', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toMatch(/valid email/i)
    }
  })

  it('rejects an out-of-set enum value', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, listings: '999' })
    expect(result.success).toBe(false)
  })

  it('reports every empty required field at once', () => {
    const result = pilotApplicationSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = Object.keys(result.error.flatten().fieldErrors)
      expect(fields).toEqual(
        expect.arrayContaining([
          'name',
          'email',
          'business',
          'selling',
          'listings',
          'suppliers',
          'format',
          'problem',
          'files',
        ]),
      )
    }
  })

  it('trims whitespace-only names', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, name: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a name over 200 characters', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, name: 'A'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects a business name over 200 characters', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, business: 'A'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects an email over 254 characters', () => {
    const longLocal = 'a'.repeat(250)
    const result = pilotApplicationSchema.safeParse({ ...valid, email: `${longLocal}@example.com` })
    expect(result.success).toBe(false)
  })

  it('lowercases and trims the email', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, email: '  Jordan@Northline.COM  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('jordan@northline.com')
  })

  it('accepts an empty honeypot (the normal, legitimate case)', () => {
    const result = pilotApplicationSchema.safeParse({ ...valid, honeypot: '' })
    expect(result.success).toBe(true)
  })

  it('accepts a missing honeypot field entirely', () => {
    const result = pilotApplicationSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.honeypot).toBeUndefined()
  })

  it('passes a non-empty honeypot value through rather than rejecting it here', () => {
    // The schema does not reject a filled honeypot — the server route handler
    // decides what to do with it (see route.test.ts). The schema only bounds its size.
    const result = pilotApplicationSchema.safeParse({ ...valid, honeypot: 'http://spam.example' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.honeypot).toBe('http://spam.example')
  })
})

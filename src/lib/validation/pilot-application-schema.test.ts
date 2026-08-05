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
})

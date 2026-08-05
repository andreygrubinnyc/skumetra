import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  fallbackInsert,
  fallbackFindRecentApplicationId,
  __resetFallbackStoreForTests,
} from './pilot-application-fallback-store'
import { toPilotApplicationRecord } from './pilot-application-repository'
import type { PilotApplication } from '@/types/pilot'

const application: PilotApplication = {
  name: 'Jordan Reyes',
  email: 'jordan@northline.com',
  business: 'Northline Supply Co.',
  selling: 'yes',
  listings: '101-500',
  suppliers: '2-3',
  format: 'csv',
  problem: 'stockouts',
  files: 'real',
}

describe('pilot-application-fallback-store', () => {
  beforeEach(() => {
    __resetFallbackStoreForTests()
  })

  it('inserts a record and returns an id', () => {
    const record = toPilotApplicationRecord(application, 'skumetra.com/pilot')
    const result = fallbackInsert(record)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.id).toMatch(/^pilot_fallback_/)
  })

  it('finds a recently inserted application by email', () => {
    const record = toPilotApplicationRecord(application, 'skumetra.com/pilot')
    fallbackInsert(record)
    expect(fallbackFindRecentApplicationId(application.email)).not.toBeNull()
  })

  it('returns null for an email with no recent submission', () => {
    expect(fallbackFindRecentApplicationId('nobody@example.com')).toBeNull()
  })

  it('does not find an application outside the recency window', () => {
    vi.useFakeTimers()
    try {
      const record = toPilotApplicationRecord(application, 'skumetra.com/pilot')
      fallbackInsert(record)
      vi.advanceTimersByTime(6 * 60_000) // 6 minutes later
      expect(fallbackFindRecentApplicationId(application.email, 5)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { isRateLimited, __resetRateLimiterForTests } from './rate-limiter'

describe('isRateLimited', () => {
  beforeEach(() => {
    __resetRateLimiterForTests()
  })

  it('allows the first request from a key', () => {
    expect(isRateLimited('1.2.3.4', 0)).toBe(false)
  })

  it('allows up to the limit within the window', () => {
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited('1.2.3.4', 0)).toBe(false)
    }
  })

  it('rejects once the limit is exceeded within the window', () => {
    for (let i = 0; i < 5; i++) isRateLimited('1.2.3.4', 0)
    expect(isRateLimited('1.2.3.4', 0)).toBe(true)
  })

  it('tracks each key independently', () => {
    for (let i = 0; i < 5; i++) isRateLimited('1.2.3.4', 0)
    expect(isRateLimited('5.6.7.8', 0)).toBe(false)
  })

  it('allows requests again once the window has passed', () => {
    for (let i = 0; i < 5; i++) isRateLimited('1.2.3.4', 0)
    expect(isRateLimited('1.2.3.4', 0)).toBe(true)
    // 16 minutes later — outside the 15-minute window.
    expect(isRateLimited('1.2.3.4', 16 * 60_000)).toBe(false)
  })
})

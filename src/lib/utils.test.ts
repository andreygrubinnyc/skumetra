import { describe, it, expect } from 'vitest'
import { cn, formatUsd } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })
  it('resolves conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatUsd', () => {
  it('omits cents for whole numbers by default', () => {
    expect(formatUsd(284)).toBe('$284')
  })
  it('shows cents for fractional values', () => {
    expect(formatUsd(31.45)).toBe('$31.45')
  })
  it('forces cents when requested', () => {
    expect(formatUsd(34, { cents: true })).toBe('$34.00')
  })
  it('rounds to two decimals', () => {
    expect(formatUsd(21.4, { cents: true })).toBe('$21.40')
  })
})

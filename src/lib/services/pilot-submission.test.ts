import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitPilotApplication, SIMULATED_FAILURE_EMAIL } from './pilot-submission'
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

describe('submitPilotApplication', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves with an id on success', async () => {
    const promise = submitPilotApplication(application)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.id).toMatch(/^pilot_sim_/)
  })

  it('resolves with an error for the simulated-failure email', async () => {
    const promise = submitPilotApplication({ ...application, email: SIMULATED_FAILURE_EMAIL })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/something went wrong/i)
  })

  it('matches the failure email case-insensitively', async () => {
    const promise = submitPilotApplication({ ...application, email: 'FAIL@Skumetra.TEST' })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result.ok).toBe(false)
  })
})

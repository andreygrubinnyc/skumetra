import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  toPilotApplicationRecord,
  insertPilotApplication,
  findRecentApplicationId,
  type PilotApplicationRecord,
} from './pilot-application-repository'
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
  comments: 'Two suppliers, mostly electronics.',
}

describe('toPilotApplicationRecord', () => {
  it('maps every application field to its DB column', () => {
    const record = toPilotApplicationRecord(application, 'skumetra.com/pilot')
    expect(record).toEqual<PilotApplicationRecord>({
      name: 'Jordan Reyes',
      email: 'jordan@example.com',
      business_name: 'Northline Supply Co.',
      amazon_selling_status: 'yes',
      listing_count_range: '101-500',
      supplier_count: '2-3',
      supplier_file_format: 'csv',
      primary_problem: 'stockouts',
      file_willingness: 'real',
      additional_details: 'Two suppliers, mostly electronics.',
      status: 'new',
      source: 'skumetra.com/pilot',
    })
  })

  it('nulls out business_name and additional_details when not provided', () => {
    const { business, comments, ...rest } = application
    void business
    void comments
    const record = toPilotApplicationRecord(rest as PilotApplication, 'skumetra.com/pilot')
    expect(record.business_name).toBeNull()
    expect(record.additional_details).toBeNull()
  })
})

/** Minimal fake matching the chain shapes the repository actually calls. */
function fakeClient(overrides: {
  insertResult?: { data: unknown; error: unknown }
  selectResult?: { data: unknown; error: unknown }
}): SupabaseClient {
  const insertResult = overrides.insertResult ?? { data: { id: 'row-1' }, error: null }
  const selectResult = overrides.selectResult ?? { data: null, error: null }

  const insertChain = {
    select: () => ({
      single: () => Promise.resolve(insertResult),
    }),
  }
  const selectChain = {
    eq: () => selectChain,
    gte: () => selectChain,
    order: () => selectChain,
    limit: () => selectChain,
    maybeSingle: () => Promise.resolve(selectResult),
  }

  return {
    from: () => ({
      insert: () => insertChain,
      select: () => selectChain,
    }),
  } as unknown as SupabaseClient
}

describe('insertPilotApplication', () => {
  const record = toPilotApplicationRecord(application, 'skumetra.com/pilot')

  it('returns ok:true with the new id on success', async () => {
    const client = fakeClient({ insertResult: { data: { id: 'row-42' }, error: null } })
    const result = await insertPilotApplication(client, record)
    expect(result).toEqual({ ok: true, id: 'row-42' })
  })

  it('returns ok:false with the error message on failure', async () => {
    const client = fakeClient({ insertResult: { data: null, error: { message: 'connection refused' } } })
    const result = await insertPilotApplication(client, record)
    expect(result).toEqual({ ok: false, error: 'connection refused' })
  })
})

describe('findRecentApplicationId', () => {
  it('returns the id when a recent row exists', async () => {
    const client = fakeClient({ selectResult: { data: { id: 'row-7' }, error: null } })
    const id = await findRecentApplicationId(client, 'jordan@example.com')
    expect(id).toBe('row-7')
  })

  it('returns null when no recent row exists', async () => {
    const client = fakeClient({ selectResult: { data: null, error: null } })
    const id = await findRecentApplicationId(client, 'jordan@example.com')
    expect(id).toBeNull()
  })

  it('fails open (returns null) when the query itself errors', async () => {
    const client = fakeClient({ selectResult: { data: null, error: { message: 'timeout' } } })
    const id = await findRecentApplicationId(client, 'jordan@example.com')
    expect(id).toBeNull()
  })
})

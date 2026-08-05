import type { PilotApplicationRecord, RepositoryInsertResult } from './pilot-application-repository'

/**
 * In-memory fallback used ONLY when no real Supabase project is configured
 * (`getServerSupabaseClient()` returned null — local dev without .env.local,
 * CI, and the default test suite). Nothing here is durable across process
 * restarts or multiple serverless instances; it exists so the full
 * validation → honeypot → rate-limit → insert → response flow can be
 * exercised end-to-end (including by Playwright) without production
 * credentials, per the requirement that the default test suite must not
 * need a real database.
 *
 * This is deliberately NOT used when Supabase env vars are present — a
 * configured deployment always uses the real database.
 */

interface FallbackRow extends PilotApplicationRecord {
  id: string
  created_at: string
}

const rows: FallbackRow[] = []

export function fallbackInsert(record: PilotApplicationRecord): RepositoryInsertResult {
  const id = `pilot_fallback_${Math.random().toString(36).slice(2, 10)}`
  rows.push({ ...record, id, created_at: new Date().toISOString() })
  return { ok: true, id }
}

export function fallbackFindRecentApplicationId(email: string, windowMinutes = 5): string | null {
  const since = Date.now() - windowMinutes * 60_000
  const match = [...rows]
    .reverse()
    .find((r) => r.email === email && new Date(r.created_at).getTime() >= since)
  return match?.id ?? null
}

/** Test-only: clear accumulated state between test runs. */
export function __resetFallbackStoreForTests(): void {
  rows.length = 0
}

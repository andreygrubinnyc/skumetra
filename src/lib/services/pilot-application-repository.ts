import type { SupabaseClient } from '@supabase/supabase-js'
import type { PilotApplication } from '@/types/pilot'

/** Row shape for the `pilot_applications` table (see supabase/migrations/0001_create_pilot_applications.sql). */
export interface PilotApplicationRecord {
  name: string
  email: string
  business_name: string | null
  amazon_selling_status: string
  listing_count_range: string
  supplier_count: string
  supplier_file_format: string
  primary_problem: string
  file_willingness: string
  additional_details: string | null
  status: 'new'
  source: string
}

export type RepositoryInsertResult = { ok: true; id: string } | { ok: false; error: string }

/** Maps the validated application shape to the DB row shape. Pure — no I/O. */
export function toPilotApplicationRecord(
  application: PilotApplication,
  source: string,
): PilotApplicationRecord {
  return {
    name: application.name,
    email: application.email,
    business_name: application.business || null,
    amazon_selling_status: application.selling,
    listing_count_range: application.listings,
    supplier_count: application.suppliers,
    supplier_file_format: application.format,
    primary_problem: application.problem,
    file_willingness: application.files,
    additional_details: application.comments || null,
    status: 'new',
    source,
  }
}

/**
 * Inserts one pilot application via the given Supabase client. The client
 * is passed in (not constructed here) so tests can inject a mock — see
 * pilot-application-repository.test.ts.
 */
export async function insertPilotApplication(
  client: SupabaseClient,
  record: PilotApplicationRecord,
): Promise<RepositoryInsertResult> {
  const { data, error } = await client
    .from('pilot_applications')
    .insert(record)
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true, id: data.id as string }
}

/**
 * Returns the id of an existing pilot_applications row for this email
 * created within the last `windowMinutes`, or null — a simple, durable
 * duplicate/rate-limit guard that survives serverless cold starts (unlike
 * an in-memory counter). Returning the real id lets the caller respond
 * with the same success shape instead of a scary error for what's likely
 * just a double-click or an accidental resubmit.
 */
export async function findRecentApplicationId(
  client: SupabaseClient,
  email: string,
  windowMinutes = 5,
): Promise<string | null> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString()
  const { data, error } = await client
    .from('pilot_applications')
    .select('id')
    .eq('email', email)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    // Fail open on the duplicate check itself — a broken check should not
    // block legitimate applications; the insert below still runs normally.
    return null
  }
  return (data?.id as string | undefined) ?? null
}

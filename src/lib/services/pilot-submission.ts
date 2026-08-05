import type { PilotApplication, PilotSubmissionResult } from '@/types/pilot'

/**
 * Submission adapter for the Founding Seller Pilot application.
 *
 * Posts to the real server-side route handler (src/app/api/pilot-application/
 * route.ts), which validates again with the same Zod schema, applies
 * honeypot/rate-limit/duplicate checks, and inserts into Supabase (or an
 * in-memory fallback store when no Supabase project is configured — see
 * getServerSupabaseClient). The form only ever imports this function.
 */
export async function submitPilotApplication(
  application: PilotApplication,
): Promise<PilotSubmissionResult> {
  let response: Response
  try {
    response = await fetch('/api/pilot-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(application),
    })
  } catch {
    return { ok: false, error: 'Something went wrong sending your application. Please try again.' }
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, error: 'Something went wrong sending your application. Please try again.' }
  }

  if (
    typeof body === 'object' &&
    body !== null &&
    'ok' in body &&
    typeof (body as { ok: unknown }).ok === 'boolean'
  ) {
    return body as PilotSubmissionResult
  }

  return { ok: false, error: 'Something went wrong sending your application. Please try again.' }
}

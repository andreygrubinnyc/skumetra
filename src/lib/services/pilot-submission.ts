import type { PilotApplication, PilotSubmissionResult } from '@/types/pilot'

/**
 * Submission adapter for the Founding Seller Pilot application.
 *
 * ─── FRONTEND-ONLY MVP ───────────────────────────────────────────────────────
 * This is a SIMULATION. No data leaves the browser. Replacing this one function
 * is the entire integration surface for real lead capture — the form imports
 * `submitPilotApplication` and nothing else. See README → "How to replace
 * simulated form submission".
 *
 * To wire up a real backend, keep this signature and swap the body, e.g.:
 *
 *   const res = await fetch('/api/pilot-application', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(application),
 *   })
 *   if (!res.ok) return { ok: false, error: 'Submission failed. Please try again.' }
 *   const { id } = await res.json()
 *   return { ok: true, id }
 *
 * Remember to re-validate `application` on the server with the same Zod schema.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SIMULATED_LATENCY_MS = 1200

/** Any application with this email deterministically hits the failure path (for demos/tests). */
export const SIMULATED_FAILURE_EMAIL = 'fail@skumetra.test'

export async function submitPilotApplication(
  application: PilotApplication,
): Promise<PilotSubmissionResult> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))

  if (application.email.trim().toLowerCase() === SIMULATED_FAILURE_EMAIL) {
    return { ok: false, error: 'Something went wrong sending your application. Please try again.' }
  }

  // A stable-ish opaque id so the success state can echo a reference.
  const id = `pilot_sim_${Date.now().toString(36)}`
  return { ok: true, id }
}

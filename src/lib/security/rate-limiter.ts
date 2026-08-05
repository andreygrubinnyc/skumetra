/**
 * Basic in-memory, per-serverless-instance IP rate limiter.
 *
 * Deliberately simple: this resets on cold start and is not shared across
 * concurrent instances/regions, so a determined attacker distributed
 * across many requests can exceed it. It raises the bar for casual abuse
 * at effectively no cost; it is not a substitute for a durable store
 * (Redis, Upstash) or a challenge (Cloudflare Turnstile) — see
 * RISKS_AND_DEPENDENCIES.md for the documented follow-up. Combined with
 * the durable per-email duplicate check in pilot-application-repository.ts
 * (which IS durable, via the database), this is judged sufficient for an
 * early-access pilot-application form.
 */

const WINDOW_MS = 15 * 60_000
const MAX_REQUESTS_PER_WINDOW = 5

const hits = new Map<string, number[]>()

export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > MAX_REQUESTS_PER_WINDOW
}

/** Test-only: clear accumulated state between test runs. */
export function __resetRateLimiterForTests(): void {
  hits.clear()
}

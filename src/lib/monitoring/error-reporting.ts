/**
 * Error-reporting boundary — server-side only.
 *
 * This is a PREPARED INTEGRATION BOUNDARY, not a live Sentry connection.
 * No Sentry project/DSN exists for this app yet, and one should not be
 * invented. Until `SENTRY_DSN` is set, this logs to the server console
 * only (visible in Vercel's function logs), which is a real, working
 * fallback — not a stub that silently does nothing.
 *
 * To wire up real Sentry:
 *   1. `npm install @sentry/nextjs`
 *   2. Run `npx @sentry/wizard@latest -i nextjs` (needs a Sentry account/DSN)
 *   3. Replace the body of `captureServerError` below with
 *      `Sentry.captureException(error, { extra: safeContext(context) })`
 *
 * Never pass form contents, applicant PII, or business data as `context` —
 * only operational metadata (route name, error type, timing).
 */

export interface ErrorContext {
  route: string
  [key: string]: string | number | boolean | undefined
}

export function captureServerError(error: unknown, context: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  console.error(`[${context.route}] ${message}`, { context, stack })

  // When SENTRY_DSN is configured and @sentry/nextjs is installed, forward here:
  // if (process.env.SENTRY_DSN) { Sentry.captureException(error, { extra: context }) }
}

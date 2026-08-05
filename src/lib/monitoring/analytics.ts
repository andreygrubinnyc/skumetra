'use client'

/**
 * Privacy-safe analytics boundary — client-side only.
 *
 * This is a PREPARED INTEGRATION BOUNDARY, not a live PostHog connection.
 * No PostHog project/key exists for this app yet, and one should not be
 * invented. Until `NEXT_PUBLIC_POSTHOG_KEY` is set, `track()` is a no-op.
 *
 * To wire up real PostHog:
 *   1. `npm install posthog-js`
 *   2. Initialize it once (e.g. in a small ClientProviders component) with
 *      `posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, { api_host: ... })`
 *   3. Replace the body of `track` below with `posthog.capture(event, properties)`
 *
 * Hard rule, not just a preference: NEVER pass form answers, names, email
 * addresses, business names, filenames, supplier information, product
 * identifiers, or financial values as `properties`. Only the high-level
 * event names below are approved. If you need a new event, add it to
 * `AnalyticsEvent` deliberately — don't pass arbitrary strings.
 */

export type AnalyticsEvent =
  | 'landing_page_viewed'
  | 'pilot_page_viewed'
  | 'pilot_form_started'
  | 'pilot_application_submitted'
  | 'pilot_application_failed'

export function track(event: AnalyticsEvent): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  // When posthog-js is installed and initialized, forward here:
  // posthog.capture(event)
}

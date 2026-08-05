'use client'

import { useEffect } from 'react'
import { track, type AnalyticsEvent } from '@/lib/monitoring/analytics'

/**
 * Fires one analytics event on mount. A no-op until NEXT_PUBLIC_POSTHOG_KEY
 * is configured — see src/lib/monitoring/analytics.ts. Renders nothing.
 */
export function PageViewTracker({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    track(event)
  }, [event])

  return null
}

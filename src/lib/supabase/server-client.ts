import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client, using the service-role key.
 *
 * Import this ONLY from server code (Route Handlers, Server Actions,
 * scripts) — never from a 'use client' component or any module bundled
 * into the browser. The service-role key bypasses Row Level Security and
 * must never reach client-side JavaScript.
 *
 * Returns `null` when the required environment variables are not set,
 * rather than throwing — callers (see pilot-application route handler)
 * use this to fall back to an in-memory test-mode store in local
 * development and CI, where no real Supabase project is configured.
 */
export function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

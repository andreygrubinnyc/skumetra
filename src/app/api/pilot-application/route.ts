import { NextResponse } from 'next/server'
import { pilotApplicationSchema } from '@/lib/validation/pilot-application-schema'
import { getServerSupabaseClient } from '@/lib/supabase/server-client'
import {
  insertPilotApplication,
  findRecentApplicationId,
  toPilotApplicationRecord,
} from '@/lib/services/pilot-application-repository'
import { fallbackInsert, fallbackFindRecentApplicationId } from '@/lib/services/pilot-application-fallback-store'
import { isRateLimited } from '@/lib/security/rate-limiter'
import { captureServerError } from '@/lib/monitoring/error-reporting'
import type { PilotApplication } from '@/types/pilot'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 10_000
const ROUTE = 'api/pilot-application'

const GENERIC_ERROR = 'Something went wrong sending your application. Please try again.'
const INVALID_ERROR = 'Please check your information and try again.'
const RATE_LIMIT_ERROR = 'Too many attempts. Please try again in a few minutes.'

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: Request) {
  try {
    // --- Request size limit -------------------------------------------------
    const raw = await request.text()
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: INVALID_ERROR }, { status: 413 })
    }

    // --- Basic rate limiting (per IP, per instance — see rate-limiter.ts) ---
    const ip = clientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false, error: RATE_LIMIT_ERROR }, { status: 429 })
    }

    // --- Parse + server-side validation (never trust the client) -----------
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return NextResponse.json({ ok: false, error: INVALID_ERROR }, { status: 400 })
    }

    const parsed = pilotApplicationSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: INVALID_ERROR }, { status: 400 })
    }
    const application = parsed.data as PilotApplication

    // --- Honeypot ------------------------------------------------------------
    // A filled honeypot means a bot, not a real applicant. Respond exactly
    // like a successful submission (without inserting anything) so the bot
    // has no signal to adapt its behavior — this is the standard, ethical
    // use of a honeypot; it never affects a real user, who never sees or
    // fills this field.
    if (application.honeypot) {
      captureServerError(new Error('honeypot triggered'), { route: ROUTE, ip })
      return NextResponse.json({ ok: true, id: `pilot_${Date.now().toString(36)}` })
    }

    const client = getServerSupabaseClient()

    // --- Duplicate / soft rate-limit by email (durable, survives cold starts) ---
    const recentId = client
      ? await findRecentApplicationId(client, application.email)
      : fallbackFindRecentApplicationId(application.email)
    if (recentId) {
      return NextResponse.json({ ok: true, id: recentId })
    }

    // --- Insert ---------------------------------------------------------------
    const record = toPilotApplicationRecord(application, 'skumetra.com/pilot')

    const result = client ? await insertPilotApplication(client, record) : fallbackInsert(record)

    if (!result.ok) {
      captureServerError(new Error(result.error), { route: ROUTE })
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: result.id })
  } catch (error) {
    captureServerError(error, { route: ROUTE })
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 500 })
  }
}

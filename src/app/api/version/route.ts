import { NextResponse } from 'next/server'

/**
 * Reports which commit is currently serving production.
 *
 * Exists so post-merge verification can prove the *new* deployment is live
 * rather than re-testing the old one and calling it a pass. Without this the
 * only options are a fixed sleep or a guess, and both hide a failed rollout.
 *
 * The commit SHA is already public in a public repository, so nothing here is
 * sensitive. Deliberately narrow: it returns the SHA and nothing else — no
 * environment names, no build metadata, no dependency versions, none of which
 * would help a legitimate caller and all of which help an attacker fingerprint
 * the deployment.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHA_RE = /^[0-9a-f]{40}$/

export function GET() {
  const raw = process.env.VERCEL_GIT_COMMIT_SHA ?? ''
  // Only echo a value that actually looks like a commit SHA, so a
  // misconfigured environment cannot turn this into an arbitrary-string
  // reflector.
  const commit = SHA_RE.test(raw) ? raw : null

  return NextResponse.json(
    { commit },
    { headers: { 'cache-control': 'no-store, max-age=0' } },
  )
}

#!/usr/bin/env node
/**
 * Post-deployment production verification.
 *
 * Runs after a merge reaches production and answers one question: is the
 * deployed site actually serving the pilot funnel, or did the merge break it?
 *
 * Deliberately read-only. The pilot form is the one place on the site where a
 * request creates a durable record about a real person, so this script never
 * POSTs to it. It proves the endpoint is deployed by confirming that a method
 * the route does not implement is rejected — which exercises routing without
 * creating an applicant record. Nothing here writes to Supabase, and nothing
 * here sends data that could be mistaken for a real application.
 *
 * With --expect-commit <sha> it first waits until /api/version reports that
 * commit, so a pass means the *new* deployment was verified rather than the
 * previous one being re-tested and mistaken for success.
 *
 * Usage:  node scripts/automation/production-smoke.mjs [--base https://skumetra.com]
 *                                                      [--expect-commit <sha>]
 * Exit:   0 all checks passed · 1 check failed · 2 could not run
 */
import process from 'node:process'

const EXIT_OK = 0
const EXIT_FAILED = 1
const EXIT_ERROR = 2

const DEFAULT_BASE = 'https://skumetra.com'
const REQUEST_TIMEOUT_MS = 15_000
const ATTEMPTS = 3
const RETRY_DELAY_MS = 5_000

/**
 * Strings that must never appear in a public response body. A deployment that
 * leaks one of these is a security incident, not a cosmetic failure.
 */
const FORBIDDEN_IN_HTML = [
  { label: 'Supabase secret key', re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { label: 'Supabase service-role JWT', re: /"role"\s*:\s*"service_role"/ },
  { label: 'service-role env name', re: /SUPABASE_SERVICE_ROLE_KEY/ },
]

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = String(arg('base', process.env.PRODUCTION_BASE_URL || DEFAULT_BASE)).replace(/\/+$/, '')
const EXPECT_COMMIT = arg('expect-commit', process.env.EXPECT_COMMIT || '')

const DEPLOY_WAIT_MS = 12 * 60 * 1000
const DEPLOY_POLL_MS = 15_000

if (EXPECT_COMMIT && !/^[0-9a-f]{40}$/.test(EXPECT_COMMIT)) {
  console.error('--expect-commit must be a full 40-character commit SHA.')
  process.exit(EXIT_ERROR)
}

if (!/^https:\/\/[a-z0-9.-]+$/i.test(BASE)) {
  console.error(`Refusing to run against "${BASE}" — an https origin with no path is required.`)
  process.exit(EXIT_ERROR)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Fetches with a timeout and a bounded retry.
 *
 * Retries only transport errors and 5xx. A 4xx is a real answer from the
 * deployment and retrying it would just paper over a genuine failure.
 */
async function request(url, { method = 'GET', redirect = 'follow' } = {}) {
  let lastError = null
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, {
        method,
        redirect,
        signal: controller.signal,
        headers: { 'user-agent': 'skumetra-production-smoke' },
      })
      if (response.status >= 500 && attempt < ATTEMPTS) {
        lastError = new Error(`HTTP ${response.status}`)
        await sleep(RETRY_DELAY_MS)
        continue
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS)
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new Error('Request failed')
}

const results = []
function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function checkLandingPage() {
  const response = await request(`${BASE}/`)
  const html = await response.text()
  record('Landing page responds 200', response.status === 200, `HTTP ${response.status}`)
  record('Landing page renders the product name', html.includes('Skumetra'))
  for (const { label, re } of FORBIDDEN_IN_HTML) {
    record(`Landing page does not expose ${label}`, !re.test(html))
  }
  return html
}

async function checkPilotPage() {
  const response = await request(`${BASE}/pilot`)
  const html = await response.text()
  record('Pilot page responds 200', response.status === 200, `HTTP ${response.status}`)
  record(
    'Pilot page renders its heading',
    html.includes('Apply for the Founding Seller Pilot'),
  )
  record('Pilot page ships the application form', /<form\b/.test(html) && html.includes('name="email"'))
  // The honeypot is server-rendered with the form, so its absence would mean
  // the anti-bot control did not ship even though the form did.
  record('Pilot form still carries its honeypot field', html.includes('name="honeypot"'))
  for (const { label, re } of FORBIDDEN_IN_HTML) {
    record(`Pilot page does not expose ${label}`, !re.test(html))
  }
}

async function checkApplicationEndpointDeployed() {
  // GET is not implemented by the route. Next.js answers 405, which proves the
  // route is deployed and reachable — without submitting anything. This script
  // must never create an applicant record in production.
  const response = await request(`${BASE}/api/pilot-application`, { method: 'GET' })
  record(
    'Pilot application endpoint is deployed and rejects unsupported methods',
    response.status === 405,
    `HTTP ${response.status}`,
  )
}

async function checkWwwRedirect() {
  const host = BASE.replace(/^https:\/\//, '')
  if (host.startsWith('www.')) return
  let response
  try {
    response = await request(`https://www.${host}/`, { redirect: 'manual' })
  } catch (error) {
    record('www redirects to the apex domain', false, `unreachable: ${error?.message ?? error}`)
    return
  }
  const location = response.headers.get('location') ?? ''
  record(
    'www redirects to the apex domain',
    [301, 307, 308].includes(response.status) && location.includes(host),
    `HTTP ${response.status} → ${location || '(no Location header)'}`,
  )
}

/**
 * Blocks until production reports the expected commit.
 *
 * Without this, every other check below could pass against the deployment the
 * merge was supposed to replace. Timing out here is a failure, not a pass:
 * "the new build never went live" is exactly the outcome worth catching.
 */
async function waitForDeployment(expected) {
  const deadline = Date.now() + DEPLOY_WAIT_MS
  let seen = null

  while (Date.now() < deadline) {
    try {
      const response = await request(`${BASE}/api/version`)
      if (response.status === 200) {
        const { commit } = await response.json()
        seen = commit
        if (commit === expected) {
          record('Expected commit is live in production', true, expected.slice(0, 7))
          return true
        }
      }
    } catch {
      // Transport failure mid-rollout is expected; keep waiting.
    }
    await sleep(DEPLOY_POLL_MS)
  }

  record(
    'Expected commit is live in production',
    false,
    `waited ${DEPLOY_WAIT_MS / 60000} min; production reports ${seen ? seen.slice(0, 7) : 'no commit'}`,
  )
  return false
}

async function main() {
  console.log(`Production smoke test — ${BASE}\n`)

  if (EXPECT_COMMIT) {
    const live = await waitForDeployment(EXPECT_COMMIT)
    if (!live) {
      console.error('\nThe expected commit never reached production. Remaining checks would')
      console.error('have verified the previous deployment, so they were not run.\n')
      return EXIT_FAILED
    }
  }

  await checkLandingPage()
  await checkPilotPage()
  await checkApplicationEndpointDeployed()
  await checkWwwRedirect()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)

  if (failed.length > 0) {
    console.error('\nProduction verification FAILED:')
    for (const f of failed) console.error(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`)
    console.error('\nDo not treat this as cosmetic. Investigate before further merges.\n')
    return EXIT_FAILED
  }

  console.log('Production verification passed. No rollback required.')
  return EXIT_OK
}

try {
  process.exit(await main())
} catch (error) {
  console.error('Production smoke test could not run:', error?.message ?? error)
  console.error('This is UNVERIFIED, not a pass.')
  process.exit(EXIT_ERROR)
}

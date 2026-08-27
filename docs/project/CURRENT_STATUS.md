# Skumetra — Current Status

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-27
**Verified against:** `4e6138f` on `main` plus the complete PR #12 diff · **Authority:** current
state only — not a journal. See
[`IMPLEMENTATION_HISTORY.md`](IMPLEMENTATION_HISTORY.md) for how we got here.

## Current milestone

Release 1 (Public Validation Site) is live and functionally complete,
including a real backend for the pilot form — ahead of where Release 1 was
originally scoped (see the note under "Ahead of schedule" below). The
immediate next milestone is beginning seller outreach, which is a
business activity tracked privately, not in this repository.

## Completed

- Public landing page, `/pilot`, `/privacy`, `/terms` — all implemented,
  live in production.
- Pilot application form: client + server Zod validation, error summary
  with focus management, honeypot, basic per-IP rate limiting, durable
  per-email duplicate check.
- **Real pilot-form persistence** — `POST /api/pilot-application` inserts
  into Supabase (`pilot_applications` table), with an in-memory fallback
  store when Supabase isn't configured. Verified end-to-end in production
  on 2026-08-05, including a database-permissions fix (see
  [`IMPLEMENTATION_HISTORY.md`](IMPLEMENTATION_HISTORY.md)).
- Privacy Policy and Terms of Service — real MVP-stage content (not
  placeholders). **Not** counsel-reviewed; missing the registered legal
  entity name, business mailing address, and governing-law jurisdiction,
  none of which are documented anywhere in this project.
- Logo, favicon, and icon assets.
- Responsive layout — manually verified with no horizontal scroll at 375px,
  768px, 1024px, and ~1600px across `/`, `/pilot`, `/privacy`, `/terms`
  (2026-08-05).
- Full automated suite includes the product tests plus direct automation-policy
  and pagination tests. Fresh counts and commands are recorded in
  `TESTING_AND_SECURITY.md`; Playwright covers desktop/mobile behavior and
  axe-core WCAG 2.1 A/AA checks.
- Production build succeeds. Lint and typecheck clean.
- GitHub Actions CI (`.github/workflows/ci.yml`) — lint/typecheck/test/build
  on every PR and push to `main`.
- PR #12 contains the repository-side event-driven Claude development system:
  deterministic issue branches, one issue/branch/PR identity, independent
  review, two-cycle bounded remediation, exact `/approve-merge` owner approval,
  expected-SHA merge, and exact-commit post-merge verification. It is not active
  on `main` until merged; owner-side Claude credential and label setup remain
  deliberately unperformed.
- Deployed to Vercel, live at `https://skumetra.com` (primary),
  `https://www.skumetra.com` (308 redirect to the primary), and
  `https://skumetra.vercel.app` (platform default) — all three independently
  verified working on 2026-08-05.
- Source code public on GitHub: `https://github.com/andreygrubinnyc/skumetra`
  (MIT-licensed; the Skumetra name/logo/brand are explicitly not covered).
- `npm audit` — 0 vulnerabilities (upgraded `next` 15→16, `vitest` 2→4).

## Ahead of schedule

"Real pilot-form persistence" is formally a Release 3 item (see
[`RELEASE_PLAN.md`](RELEASE_PLAN.md)), but was built and shipped as part of
completing Release 1 properly, since a public validation site with a
simulated, non-persisted form doesn't actually validate anything. Treat
Release 1 as done; treat Release 3 as still meaning everything else in its
list (auth, file processing, matching, calculations, alerts).

## Partially implemented

- Privacy/Terms — real content exists but is not legally complete (see
  above).

## Planned

- Sentry error monitoring — boundary function exists
  (`src/lib/monitoring/error-reporting.ts`), logs to console only; no DSN
  set, SDK not installed.
- PostHog analytics — boundary function exists
  (`src/lib/monitoring/analytics.ts`), no-op until a key is set.
- Cloudflare Turnstile — no site key available yet; honeypot + rate
  limiting are the only spam protection live today.

## Deferred (by design, not oversight)

Authentication, user accounts, a general-purpose database beyond the single
`pilot_applications` table, private file storage, Amazon/supplier file
upload, CSV/Excel processing, column mapping, product matching (AI or
exact), confidence scoring, deterministic financial calculations
(safe-price, margin), **stock and cost change detection** (the literal
mechanism in the locked promise — not built yet), alerts, recommendations,
seller approval/rejection actions, activity history, repeat imports,
background jobs, email summaries, Stripe, usage limits, and any Amazon
SP-API integration. See [`RELEASE_PLAN.md`](RELEASE_PLAN.md) for which
release each belongs to.

The `src/components/product/*` components (dashboard preview, Action
Center, Product Matching, Protection Rules) render **static, fictional
sample data only** — they are illustrative previews of the future product,
not functional capability. Don't describe them as working features.

## Blocked

The repository-side automation architecture is complete in PR #12, but it must
not merge until its exact head, complete diff, fresh PR checks, Vercel preview,
and owner review pass. Owner-side Claude credential and label setup is a later
protected step, not part of this PR.

## GitHub-side controls

Repository files define CI, Dependency Review, CodeQL, and Dependabot version
updates. Their live GitHub settings must still be re-checked through the API at
each protected handoff; a file alone is never reported as proof that a
repository-side setting is active. See `TESTING_AND_SECURITY.md`.

## Immediate next steps

1. Complete independent checks and owner review for PR #12 without merging it
   early or performing owner setup.
2. Decide on Sentry/PostHog activation timing.
3. Resolve the legal-entity-name/address/jurisdiction gap for Privacy/Terms
   before treating them as launch-complete.
4. Begin Release 2 planning (interactive product demonstration with
   realistic sample data) when ready — see `RELEASE_PLAN.md`.

# Skumetra — Deployment and Operations

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-05

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
npm run typecheck
npm test                # Vitest
npm run test:e2e:install  # one-time
npm run test:e2e          # Playwright
npm run build
```

No environment variables are required for local dev, tests, or build — the
pilot-application route falls back to an in-memory store when Supabase
isn't configured. See `.env.example` for the full variable list and what
each one does.

## Environment handling

- `.env.example` documents variable names and purpose only — never real
  values.
- `.env` / `.env*.local` are gitignored.
- Real values live only in Vercel's Project Settings → Environment
  Variables (Production + Preview), never in this repository.

## GitHub

Public repository: `https://github.com/andreygrubinnyc/skumetra`
(MIT-licensed code; brand not covered). `main` is the default and only
long-lived branch. See `TESTING_AND_SECURITY.md` for what's configured vs.
unverified on the GitHub side.

## Vercel

- Project imported from the GitHub repo; framework auto-detected as
  Next.js.
- Deploys automatically on push to `main` (production) and on other
  branches/PRs (preview).
- Environment variables set: `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Production +
  Preview scope). Actual values are never recorded in any repository file.

## Supabase

- One project, one migration
  (`supabase/migrations/0001_create_pilot_applications.sql`), applied via
  the Supabase SQL Editor (not yet via an automated migration runner —
  there is no CI/CD step that applies migrations automatically; running a
  new migration is currently a manual step).
- RLS enabled, zero permissive policies, explicit `service_role` table
  grants (see `TESTING_AND_SECURITY.md`).

## Domains — verified 2026-08-05

| Domain | Role | Verified status |
|---|---|---|
| `skumetra.com` | Primary/canonical production URL | Live, HTTP 200, independently verified via direct request |
| `www.skumetra.com` | Redirect | Live, HTTP 308 → `https://skumetra.com/`, independently verified |
| `skumetra.vercel.app` | Vercel platform default | Live, HTTP 200, independently verified |

Use `https://skumetra.com` as the canonical URL in any new documentation,
metadata, or copy.

## Form persistence

Real, via Supabase (see `ARCHITECTURE.md`). Falls back to a non-durable
in-memory store only when Supabase env vars are absent — this should never
happen in production; if it does, submissions are being silently lost on
every cold start and this needs immediate attention.

## Monitoring and analytics

Prepared boundaries only, not active:

- **Sentry** (`src/lib/monitoring/error-reporting.ts`) — logs to console /
  Vercel function logs until `SENTRY_DSN` is set and `@sentry/nextjs` is
  installed.
- **PostHog** (`src/lib/monitoring/analytics.ts`) — `track()` calls are
  no-ops until `NEXT_PUBLIC_POSTHOG_KEY` is set. Approved event list is
  defined in that file; never send form contents or PII as event
  properties.

## Backups and recovery

- Source code: backed up by GitHub (public repo).
- Database: whatever Supabase's own backup policy provides for the current
  plan tier — not independently verified from this repository.
- Private documentation (`docs/private` branch): local-only, single point
  of failure by deliberate choice — see that branch's own
  `RISKS_AND_OPEN_QUESTIONS.md`.

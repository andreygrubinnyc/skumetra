# Skumetra — Testing and Security

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-05
**Verified against commit:** `31091a7` on `main`

## Implemented and passing (verified today)

- **Unit/component tests (Vitest):** 76/76 passing, re-run fresh 2026-08-05.
  Covers the Zod schema, rate limiter, pilot-application repository +
  fallback store, submission adapter, route handler (mocked Supabase client
  and error reporter), and form component.
- **Lint (ESLint, flat config):** 0 errors, 0 warnings as of 2026-08-05
  (the two `jsx-a11y/role-supports-aria-props` warnings on the pilot form's
  radiogroups were fixed by moving `aria-invalid`/`aria-describedby` to the
  wrapping `<fieldset>`).
- **Typecheck (`tsc --noEmit`):** clean.
- **Production build:** succeeds.
- **`npm audit`:** 0 vulnerabilities (after the `next` 15→16 / `vitest` 2→4
  upgrade).
- **E2E + accessibility (Playwright):** `tests/e2e/skumetra.spec.ts`,
  `tests/e2e/accessibility.spec.ts` — 24/24 passing, re-run fresh
  2026-08-05 (Desktop Chrome + mobile viewport). Includes 8 axe-core
  WCAG 2.1 A/AA checks, 0 violations.
- **Responsive breakpoints:** manually verified, no horizontal scroll, at
  375px, 768px, 1024px, and ~1600px across `/`, `/pilot`, `/privacy`,
  `/terms` — 2026-08-05.

## Recommended, not yet done

- Manual screen-reader pass (automated axe-core coverage exists; that's not
  the same thing).
- Manual link check (internal anchors, `mailto:`, footer links).

## GitHub-side controls — external confirmation required

None of the following show up as files in this repository. That means
**they are unverified, not confirmed-absent** — Andrey's 2026-08-05
decision is explicit that these must not be assumed based on repository
files alone:

| Control | Repository evidence | Status |
|---|---|---|
| Branch protection / rulesets on `main` | None found | External confirmation required |
| Required status checks | None found | External confirmation required |
| Dependabot | No `dependabot.yml` | External confirmation required |
| Dependency Review Action | Not in `.github/workflows/` | External confirmation required |
| CodeQL | No CodeQL workflow | External confirmation required |
| Action SHA pinning | Workflow uses tag refs (`actions/checkout@v4`, `actions/setup-node@v4`), not pinned commit SHAs | Implemented, but at a weaker pinning level than SHA-pinning |
| `CODEOWNERS` | None found | Not configured |

Check these directly in the GitHub UI/API before ever stating one is
"enabled" in any future documentation update.

## CI (implemented, verified)

`.github/workflows/ci.yml` — runs on every pull request and every push to
`main`. Job `build-and-test` (display name "Lint, typecheck, test, build"):
`npm ci` → lint → typecheck → test → build. `permissions: contents: read`.
No secrets required — the build uses the in-memory fallback store when
Supabase env vars are absent, same as local dev.

## Local hooks

**None configured.** No `.husky` directory, no active
`.git/hooks/pre-commit` script. Any "gate" enforcement today happens only
in CI (on push/PR) or manually, not at commit time locally.

## Repository-level Claude policy

This repository's own `CLAUDE.md` (not the unrelated parent-folder file —
see `DECISION_LOG.md`) documents the actual workflow/security expectations
for this repo. Read it directly rather than assuming any particular policy
applies.

## Security review notes (from this session's work)

- Row Level Security is enabled on `pilot_applications` with zero
  permissive policies — only the server-side secret key can access it, and
  that key never reaches the browser (verified: not referenced from any
  `'use client'` file, not prefixed `NEXT_PUBLIC_`).
- Bypassing RLS and having table-level `GRANT`s are separate concerns in
  Postgres — a real incident on 2026-08-05 (fixed same day) is a concrete
  reminder to verify a new table with a live request, not just a
  correctly-configured RLS policy. Full incident narrative is in the
  private documentation (credential-handling details); the general pattern
  is stated here because it's a reusable technical lesson, not sensitive.
- Known, documented, low-severity gap: a TOCTOU race in duplicate-email
  detection (check-then-insert, not atomic) — two near-simultaneous
  submissions with the same email could both insert. Acceptable for a
  review queue today; a DB unique constraint + upsert would close it.

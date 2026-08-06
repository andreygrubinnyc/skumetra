# Skumetra — Implementation History

**Owner:** Andrey Grubin · **Status:** Active (append-only) · **Last verified:** 2026-08-05

Meaningful completed changes, not a full `git log` copy. Reconstructed from
Git history and this session's own verified work — nothing invented.

## 2026-08-04 — Initial build (Release 1 frontend)

Landing page (11 sections), `/pilot`, `/privacy` and `/terms` as
placeholders, `SkumetraLogo`/`SkumetraMark` components, favicon/icon assets,
pilot form with client-side validation and a **simulated** submission
adapter. ESLint configured (`eslint.config.mjs`) after initially having no
non-interactive lint setup. Commit `4515879`, then `20c290b` (ESLint).

**Verification at the time:** 39/39 Vitest tests, 24/24 Playwright
(e2e + accessibility), production build succeeded, typecheck clean.

## 2026-08-04 — MIT license, public GitHub publication

Added `LICENSE` (MIT, with the Skumetra name/logo/brand explicitly
excluded). Published `main` to `https://github.com/andreygrubinnyc/skumetra`.
Commit `ac84654`. See `DECISION_LOG.md` for the accompanying decision to
keep business-sensitive documentation off the public repo.

## 2026-08-04/05 — Dependency audit fixes

Upgraded `next` 15→16 and `vitest` 2→4 (transitively `@vitejs/plugin-react`
4→6, `vite` 5→8) to resolve pre-existing `npm audit` findings (1 critical —
Vitest UI server arbitrary file read/execute, never enabled in this
project; 4 high — bundled `postcss`/`sharp` CVEs; 3 moderate — dev-only
`esbuild`/`vite` chain). Required moving `lint` from `next lint` (removed in
Next 16) to `eslint .` directly, and fixing a legitimate `react-hooks/refs`
finding in the pilot form's focus-management pattern (moved a ref-touching
side effect into a `useEffect`). `npm audit` now reports 0 vulnerabilities.
Commit `061992b`.

## 2026-08-05 — GoDaddy static-export detour, reverted

A branch configuring the app for static export (GoDaddy hosting) was
started and then explicitly abandoned per Andrey's instruction — Skumetra
runs on Vercel as a normal server-capable Next.js app. Reverted back to
`main`; confirmed no `output: "export"` config remains.

## 2026-08-05 — Real pilot-application backend ("Skumetra Next Task")

The largest single change in the project's history so far. Replaced the
simulated pilot-form submission with:

- A Supabase migration (`pilot_applications` table, RLS enabled, zero
  permissive policies).
- A server-only Supabase client (`src/lib/supabase/server-client.ts`) and a
  dependency-injected repository layer, with an in-memory fallback store
  so the default test suite and CI need zero real credentials.
- A real Route Handler (`POST /api/pilot-application`) with server-side Zod
  re-validation, a honeypot, basic per-IP rate limiting, and a durable
  per-email duplicate check.
- Real Privacy Policy and Terms of Service content (replacing placeholders)
  — explicitly not claiming a registered legal entity name/address that
  isn't documented anywhere in the project.
- Prepared (inactive) Sentry and PostHog integration boundaries.
- Fixed the two pre-existing `jsx-a11y/role-supports-aria-props` lint
  warnings on the pilot form's radiogroups.
- Added/updated tests (76 Vitest, updated Playwright specs) and a GitHub
  Actions CI workflow.

**Verification:** typecheck/lint clean, 76/76 Vitest tests, production
build succeeded. Merged to `main`, pushed to GitHub, deployed to Vercel.

## 2026-08-05 — Production RLS/grant incident, fixed same day

After wiring real Supabase credentials into Vercel, live submissions failed
(`permission denied for table pilot_applications`). Root cause: RLS-bypass
and table-level `GRANT`s are separate Postgres concepts — `service_role`
never received an explicit grant on the new table. Fixed with an explicit
`GRANT` statement, both applied directly and added to the migration file
so it's self-sufficient going forward. Verified with a real end-to-end
production submission afterward. Commit `c6d9848`, merged via `31091a7`.

## 2026-08-05 — Documentation continuity system (this work)

Phase 1 read-only audit of the full repository and source planning
documents, followed by this `docs/project/` package plus a local-only
`docs/private` branch for business-sensitive content. Discovered and
reconciled an earlier, unmerged documentation branch
(`docs/project-management-baseline`, dated 2026-08-04) — preserved as
historical record rather than deleted.

## 2026-08-05 — Pre-merge review of the documentation package

Before merging `docs/public-baseline` into `main`: manually verified the
768px and 1024px breakpoints (previously untested — no horizontal scroll
on any route), re-ran the full Playwright suite fresh (24/24, including
accessibility), and re-read every file for business-sensitive content.
Found and fixed one issue — several public files named specific
`docs/private` sub-filenames rather than pointing at the branch generally;
generalized to branch-level mentions only.

# Skumetra — Latest Handoff

**Updated:** 2026-08-05
**Locked promise:** Skumetra helps Amazon sellers detect supplier stock and
cost changes before they cause unprofitable or unavailable sales.

## Branch and commit

- `main` — `31091a7` (as of this handoff; check `git log` for anything
  newer). Working tree should be clean; verify with `git status` before
  trusting this.
- This documentation work happened on a feature branch off `main`
  (`docs/public-baseline`) — check whether it's been merged yet.
- A local-only `docs/private` branch also exists — never push or merge it.
- `docs/project-management-baseline` (older, unmerged) is preserved as
  historical reference only.

## Current release and milestone

Release 1 (Public Validation Site) — done, and exceeded (real Supabase
backend, real legal-page content, not just placeholders). See
`CURRENT_STATUS.md` for exact detail.

## What's implemented

Public landing page, `/pilot` with a real (not simulated) backend,
`/privacy` and `/terms` with real (not counsel-reviewed) content, live at
`https://skumetra.com`. Full detail in `CURRENT_STATUS.md`.

## What's not implemented

Everything from Release 2 onward: interactive product screens with
realistic data, authentication, real file processing, product matching,
financial calculations, alerts, and everything after that. See
`RELEASE_PLAN.md`. The `src/components/product/*` previews are static and
fictional — don't mistake them for working features.

## Worktree considerations

The parent folder (`SKUMETRA/`, one level up from this repo) is
**not** a Git repository — it holds pre-project source docs
(`CLAUDE_PROJECT_PROMPT.md`, the MVP brief/workflow/technology docs, sample
CSVs). Don't expect Git history or commit SHAs to explain anything there.

## Most recent completed work

Documentation continuity system (this package) — see
`IMPLEMENTATION_HISTORY.md` for the full dated history, most recently: a
production RLS/grant fix (2026-08-05) that had briefly broken real pilot
submissions after deployment.

## Checks last run and results (2026-08-05)

- `npm run lint` — clean.
- `npm run typecheck` — clean.
- `npm test` (Vitest) — 76/76 passing.
- `npm run build` — succeeded.
- Playwright e2e/accessibility — **not re-run** in this documentation pass;
  last known result 24/24. Re-run before relying on this number.
- Live production check: real Supabase insert verified working via a
  direct API call against `https://skumetra.vercel.app`.

## Known issues, risks, blockers

See `RISKS_AND_OPEN_QUESTIONS.md` (public) and, if you have access, the
local-only `docs/private` branch for business context. Nothing is
currently a hard blocker on technical work.

## Exact next recommended task

Manually verify the 768px/1024px breakpoints, then begin Release 2 scoping
(breaking `../../Skumetra_MVP_First_Application_Pages.md` and
`../../Skumetra_MVP_Workflow.md` into page-level specs) when ready. Seller
outreach itself is a business activity, not a code task, and isn't blocked
by anything here.

## Files to read first

1. `PROJECT_INDEX.md` (repo root)
2. This file
3. `CURRENT_STATUS.md`
4. `PRODUCT_BASELINE.md`

## Files likely to be changed next

`src/components/product/*` (if Release 2 scoping starts), or
`docs/project/RELEASE_PLAN.md` / `CURRENT_STATUS.md` (as work progresses).

## Safety and scope reminders

- Don't broaden the locked promise or the product scope.
- Don't invent a deterministic financial formula — it's explicitly
  undefined; get a decision from Andrey first.
- Don't commit directly to `main` — use a feature branch.
- Don't put business-sensitive content in the public repo — when
  uncertain, it goes in `docs/private` instead.

## Resume from here

Read `CURRENT_STATUS.md`, confirm `git status`/`git log` match what's
described above, re-run the test suite fresh rather than trusting this
file's numbers, then pick up the next recommended task.

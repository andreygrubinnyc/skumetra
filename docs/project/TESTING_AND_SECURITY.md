# Skumetra — Testing and Security

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-17
**Verified against commit:** `8381c29` on `main`

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

## Security controls — what enforces what

Controls are grouped by **where they are enforced**, because a file in this
repository is not the same thing as a setting active on GitHub. Status must be
re-verified through the GitHub API rather than inferred from this document.

### Enforced locally (Git hooks)

Hooks live in `.githooks/` and are activated via `core.hooksPath`, wired up by
the `prepare` script on `npm install`. No hook-framework dependency is used —
it is a single Git setting.

| Gate | Runs | Approx. runtime |
|---|---|---|
| `pre-commit` (`npm run verify:commit`) | Staged secret/private-path scan, lint, typecheck, unit tests | ~7s |
| `pre-push` (`npm run verify:push`) | All security scans, lint, typecheck, unit tests, build, `npm audit --audit-level=high`, Playwright e2e | ~2–4 min |

The pre-push gate needs Playwright browsers; if they are missing it fails with
the install command rather than skipping silently. A skipped check that reports
success is worse than no check at all.

**Emergency bypass:** `git commit --no-verify` / `git push --no-verify`. This
exists for a genuine emergency, not as a normal step. Bypassing means the change
is *unverified* — re-run the gate and fix the cause immediately afterwards.

### Enforced in the repository (CI workflows)

| Workflow | Check name | Purpose |
|---|---|---|
| `ci.yml` | `Lint, typecheck, test, build` | Core quality gate |
| `ci.yml` | `Security scans and dependency audit` | Secret, boundary, workflow scans + `npm audit` |
| `ci.yml` | `End-to-end and accessibility tests` | Playwright + axe-core |
| `dependency-review.yml` | `Dependency review` | Blocks newly introduced high/critical advisories |
| `codeql.yml` | `CodeQL analysis` | Static analysis, plus a weekly schedule |

All workflows declare `permissions: contents: read` at the top level, set job
timeouts, cancel superseded pull-request runs, and use
`persist-credentials: false` on checkout. **Every third-party Action is pinned
to a full 40-character commit SHA**, with the release tag in a trailing
comment — a tag can be repointed by an upstream compromise, a SHA cannot.
`npm run security:workflows` fails the build if an unpinned action, a missing
permissions block, a missing timeout, `pull_request_target`, or
untrusted-input interpolation is introduced.

### Security scanners

`scripts/security/` holds dependency-free Node scanners:

- `scan-staged.mjs` — pre-commit gate over staged blob content; runs the
  credential, forbidden-path, **and personal-data** detectors
- `scan-repository.mjs` — full-tree credential scan
- `scan-public-boundary.mjs` — private paths and third-party personal data
- `scan-workflows.mjs` — GitHub Actions hardening rules

Findings are always **redacted** — a scanner that prints the secret it found has
just copied it into the CI log.

The allowlist (`scripts/security/allowlist.mjs`) is structurally constrained,
not merely conventionally narrow. `validateAllowlist()` runs at module load and
throws on a malformed entry, so the rules cannot be quietly relaxed:

- **exact file paths only** — a directory entry would silently exempt every
  file added there later;
- **explicit pattern ids only** — no `'*'` wildcard, so widening an exemption
  is a visible diff;
- **a written reason on every entry.**

The active entries were derived by running the detectors against the scanner
directory with no allowlist at all and exempting only what actually fired: two
files, five pattern ids. The other six scanner files have no exemption, and a
secret planted in any of them is still blocked.

The workflow scanner requires `timeout-minutes` on **every job** individually,
parsed from the `jobs:` block rather than matched across the whole file — keys
under `on:` and `permissions:` sit at the same indentation and are not jobs, and
a step-level timeout does not bound the job containing it.

Scanner behaviour is covered by tests using synthetic fixtures only.

### Enforced by GitHub — verify before claiming

These are GitHub settings, not files here. Re-check with the API; never infer
them from this table.

| Control | Where to check |
|---|---|
| `main` ruleset (PR required, required checks, force-push and deletion blocked) | `gh api repos/:owner/:repo/rulesets` |
| Dependabot alerts | `gh api repos/:owner/:repo/vulnerability-alerts` |
| Dependabot security updates | `gh api repos/:owner/:repo` → `security_and_analysis` |
| Secret scanning + push protection | `gh api repos/:owner/:repo` → `security_and_analysis` |
| Private vulnerability reporting | `gh api repos/:owner/:repo/private-vulnerability-reporting` |
| Default workflow token permissions | `gh api repos/:owner/:repo/actions/permissions/workflow` |
| Allowed-Actions policy | `gh api repos/:owner/:repo/actions/permissions` |

`.github/dependabot.yml` configures weekly **version** updates for npm and
GitHub Actions, grouped for minor/patch. Dependabot **security** updates are a
separate repository setting. Nothing auto-merges.

### Deferred by decision

**Signed commits are not required in this phase** — a deliberate deferral, not
an oversight. Revisit when more than one person commits.

`CODEOWNERS` is not configured: with a single maintainer it would impose a
review requirement that cannot be satisfied.

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

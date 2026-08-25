@AGENTS.md

# Skumetra — Project Instructions

These are the actual instructions for this repository. A different file,
`SKUMETRA/CLAUDE.md`, sits one directory up (outside this Git repo) and
describes an unrelated project ("Priorena") — it does not apply here. See
[`docs/project/DECISION_LOG.md`](docs/project/DECISION_LOG.md) for how that
was confirmed.

Start at [`PROJECT_INDEX.md`](PROJECT_INDEX.md) for full context. This file
is a summary of what governs day-to-day work, not a replacement for it.

## Product scope

The locked promise, primary customer, required capabilities, and explicit
exclusions are in
[`docs/project/PRODUCT_BASELINE.md`](docs/project/PRODUCT_BASELINE.md) and
`../CLAUDE_PROJECT_PROMPT.md` (parent folder, authoritative for product
content). Do not broaden scope, invent capabilities, or change the locked
promise without Andrey's explicit approval. Do not build toward Amazon
SP-API automation, automatic Amazon changes, or AI-computed financial
values — these are permanently excluded, not just deferred.

## Architecture

Skumetra is a normal server-capable Next.js application on Vercel — **not**
a static export, and not configured for any other hosting target (a prior
GoDaddy static-export attempt was explicitly reverted; don't repeat it).
See [`docs/project/ARCHITECTURE.md`](docs/project/ARCHITECTURE.md) for the
current/intended/deferred boundaries.

## Development workflow

- Do not commit directly to `main`. Use a focused feature branch, then
  merge (or open a PR) once it's verified.
- Before committing: review the actual diff (`git status`, `git diff`,
  `git diff --cached`) — don't stage blindly with `git add -A`. Confirm
  every changed file belongs to the task at hand.
- Before committing code: run `npm run verify:commit` (staged security scan,
  lint, typecheck, unit tests). Before pushing: `npm run verify:push`, which
  adds the build, the dependency audit, the full security scans, and the
  Playwright suite. Git hooks run these automatically after `npm install`.
- **Never bypass a hook or check.** `--no-verify` exists for a genuine
  emergency and is not a way to get a commit through. If a check cannot run
  (missing tool, no network), that is *unverified* — say so rather than
  reporting a pass.
- Prefer creating a new commit over amending, unless explicitly asked to
  amend.
- Don't push or merge without the user's go-ahead, unless they've clearly
  already authorized it for this specific change.

## Security requirements

- `SUPABASE_SERVICE_ROLE_KEY` (or whatever the current Supabase secret key
  is called) is server-only. Never reference it from a `'use client'` file,
  never prefix it `NEXT_PUBLIC_`, never write its value into any file in
  this repository, chat, or documentation.
- Row Level Security stays enabled on every table with zero permissive
  policies for `anon`/`authenticated` unless a specific, narrow, reviewed
  need requires otherwise. Remember that bypassing RLS and having
  table-level `GRANT`s are separate Postgres concepts — verify a new
  table works with a real request, not just a correctly-configured policy.
- Don't invent legal text (Privacy Policy, Terms), customers, testimonials,
  integrations, certifications, partnerships, traction, or financial
  results — anywhere, including in documentation.
- Don't compute financial values (safe price, margin) with AI — they must
  be deterministic. If the formula isn't defined yet, say so and ask,
  don't invent one.
- Business-sensitive content (pricing hypotheses, validation targets, kill
  criteria, internal risks, sensitive decision context, credential-handling
  incident detail) does not go in this public repository, on any branch
  that could be pushed or merged into `main`. It goes in the local-only
  `docs/private` branch instead — see that branch's `README.md`. This
  repo is public on GitHub; treat everything committed here as visible to
  anyone.
- **Never commit real seller, supplier, prospect, interview, or applicant
  data** — no names, emails, phone numbers, profile URLs, or exported
  records. Fictional sample data must be obviously fictional.
- **Never push a local-only validation branch.** Branches under
  `validation/*` and `docs/private` exist only on the maintainer's machine
  and must not be pushed, merged, or referenced in a public pull request.
- Keep Skumetra separate from any employer system. Never use PJM or
  Prudential accounts, storage, devices, or communication channels for this
  project, and never commit material originating from them.
- **Report security controls accurately.** A file existing in the repository
  does not mean a GitHub-side control is active. Verify branch protection,
  Dependabot, CodeQL, and Dependency Review through the GitHub API before
  describing any of them as enabled, and say "external confirmation
  required" when you cannot check.
- Make no compliance or certification claims (SOC 2, ISO, PCI, "bank-grade",
  "enterprise-grade"). None have been obtained.

## Documentation

Keep [`docs/project/CURRENT_STATUS.md`](docs/project/CURRENT_STATUS.md) and
[`docs/project/LATEST_HANDOFF.md`](docs/project/LATEST_HANDOFF.md) current
after any substantial change — see
[`docs/project/DOCUMENTATION_MAINTENANCE.md`](docs/project/DOCUMENTATION_MAINTENANCE.md)
for the full closeout checklist.

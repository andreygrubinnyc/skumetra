# Skumetra — Project Index

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-05
**Verified against commit:** `31091a7` on `main`

This is the starting point for a new person or AI session picking up this
project. Read it first, then follow the order below.

## Locked promise

> Skumetra helps Amazon sellers detect supplier stock and cost changes
> before they cause unprofitable or unavailable sales.

Do not rewrite, broaden, or reinterpret this. It is not a repricer,
marketplace, product-research tool, autonomous seller, or dropshipping
platform.

## Current release and milestone

**Release 1 — Public Validation Site.** Landing page, Founding Seller Pilot
application, and legal pages are live at `https://skumetra.com`, with a real
(not simulated) backend for the pilot form. See
[`docs/project/CURRENT_STATUS.md`](docs/project/CURRENT_STATUS.md) for the
exact current state and [`docs/project/RELEASE_PLAN.md`](docs/project/RELEASE_PLAN.md)
for what's in each of the four releases.

## Recommended reading order

1. **This file.**
2. [`docs/project/LATEST_HANDOFF.md`](docs/project/LATEST_HANDOFF.md) — restart context for a new session.
3. [`docs/project/CURRENT_STATUS.md`](docs/project/CURRENT_STATUS.md) — exact verified state today.
4. [`docs/project/PRODUCT_BASELINE.md`](docs/project/PRODUCT_BASELINE.md) — what Skumetra is and isn't.
5. [`docs/project/RISKS_AND_OPEN_QUESTIONS.md`](docs/project/RISKS_AND_OPEN_QUESTIONS.md) — what's unresolved.
6. Everything else, as needed for the task at hand.

## Documentation map

| File | Owns |
|---|---|
| [`docs/project/CURRENT_STATUS.md`](docs/project/CURRENT_STATUS.md) | Exact current state — completed, in progress, planned, deferred, blocked |
| [`docs/project/PRODUCT_BASELINE.md`](docs/project/PRODUCT_BASELINE.md) | Product promise, customer, positioning, required capabilities, exclusions |
| [`docs/project/ARCHITECTURE.md`](docs/project/ARCHITECTURE.md) | Current vs. intended vs. deferred architecture |
| [`docs/project/TECHNOLOGY_STACK.md`](docs/project/TECHNOLOGY_STACK.md) | What's selected, installed, configured, connected |
| [`docs/project/DATA_AND_BUSINESS_RULES.md`](docs/project/DATA_AND_BUSINESS_RULES.md) | Entities, fields, AI permissions/prohibitions, deterministic-calculation boundary |
| [`docs/project/DECISION_LOG.md`](docs/project/DECISION_LOG.md) | Chronological decisions, with what superseded what |
| [`docs/project/RELEASE_PLAN.md`](docs/project/RELEASE_PLAN.md) | The four releases — scope, exit criteria, current status |
| [`docs/project/TESTING_AND_SECURITY.md`](docs/project/TESTING_AND_SECURITY.md) | Test coverage, CI, dependency audit, what's GitHub-side-unverified |
| [`docs/project/CLAUDE_AUTOMATION.md`](docs/project/CLAUDE_AUTOMATION.md) | How work reaches production, and where the owner's two decisions sit |
| [`docs/project/DEPLOYMENT_AND_OPERATIONS.md`](docs/project/DEPLOYMENT_AND_OPERATIONS.md) | Local dev, Vercel, Supabase, domains, monitoring |
| [`docs/project/RISKS_AND_OPEN_QUESTIONS.md`](docs/project/RISKS_AND_OPEN_QUESTIONS.md) | Public-safe risks and open questions |
| [`docs/project/IMPLEMENTATION_HISTORY.md`](docs/project/IMPLEMENTATION_HISTORY.md) | Meaningful completed changes, dated |
| [`docs/project/LATEST_HANDOFF.md`](docs/project/LATEST_HANDOFF.md) | Restart document for a new session |
| [`docs/project/DOCUMENTATION_MAINTENANCE.md`](docs/project/DOCUMENTATION_MAINTENANCE.md) | When to update what |

## Source-of-truth hierarchy

1. Current repository code and configuration — for what's actually implemented.
2. `../CLAUDE_PROJECT_PROMPT.md` (parent folder, not version-controlled) — for locked product scope.
3. `../Skumetra_MVP_Product_Brief.md`, `_Workflow.md`, `_Technology_Selection.md`, `_First_Application_Pages.md` — source planning detail, superseded on release numbering (see `DECISION_LOG.md`).
4. Git history and this `docs/project/` package.
5. Explicit assumptions, clearly labeled as such.

If two sources conflict, it's recorded in `RISKS_AND_OPEN_QUESTIONS.md`, not silently resolved.

## A private counterpart exists

A local-only Git branch, `docs/private`, holds business-sensitive content
(pricing hypotheses, validation targets, kill criteria, internal risks,
sensitive decision context, credential-handling notes) that is deliberately
kept out of this public repository. It is never pushed or merged. If you
don't have access to it, the public docs here are still self-sufficient for
resuming technical work — you'll just be missing internal business context.

## Safely resuming work

1. Check `git status` and `git branch` — don't assume the working tree
   matches any chat summary.
2. Read `LATEST_HANDOFF.md`, then `CURRENT_STATUS.md`.
3. Re-run `npm run lint && npm run typecheck && npm test && npm run build`
   before trusting any prior "passing" claim — verify, don't assume.
4. Don't commit directly to `main` — use a feature branch (see the repo's
   [`CLAUDE.md`](CLAUDE.md) for the current workflow).
5. Preserve the locked promise and the exclusions in `PRODUCT_BASELINE.md`.

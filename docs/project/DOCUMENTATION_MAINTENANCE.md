# Skumetra — Documentation Maintenance

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-05

## When to update each document

| Trigger | Update |
|---|---|
| A fact about current state changed | `CURRENT_STATUS.md` |
| A decision was made | `DECISION_LOG.md` — new row; mark any superseded row, don't delete it |
| Architecture changed (current or intended) | `ARCHITECTURE.md` |
| A technology's install/config/connection status changed | `TECHNOLOGY_STACK.md` |
| A new entity/field/rule was defined, or a formula gap was filled | `DATA_AND_BUSINESS_RULES.md` |
| Meaningful work happened | `IMPLEMENTATION_HISTORY.md` — new dated entry |
| A risk or open question emerged or resolved | `RISKS_AND_OPEN_QUESTIONS.md` |
| A release's scope or status changed | `RELEASE_PLAN.md` |
| Tests were run | `TESTING_AND_SECURITY.md` |
| Something was deployed or domain/env config changed | `DEPLOYMENT_AND_OPERATIONS.md` |
| Ending a substantial session | `LATEST_HANDOFF.md` — fully rewritten, not appended |

**Before writing anything into a public file**, check it against the
sensitive categories in `docs/private/README.md` (on the local-only
`docs/private` branch). When uncertain, it goes there instead.

## Closeout checklist for material work

1. Verify code and Git status (`git status`, `git log`) — don't trust a
   chat summary.
2. Update `CURRENT_STATUS.md`.
3. Add accepted or superseded decisions to `DECISION_LOG.md`.
4. Update `ARCHITECTURE.md` / `TECHNOLOGY_STACK.md` if either changed.
5. Add a dated entry to `IMPLEMENTATION_HISTORY.md`.
6. Update `RISKS_AND_OPEN_QUESTIONS.md`.
7. Rewrite `LATEST_HANDOFF.md` to reflect the new current state.
8. Run the documentation validation pass below.
9. Record the verification date and commit SHA in every file's metadata
   header that changed.
10. Confirm no secrets or private data were added, and no business-sensitive
    content leaked into a public file.

## Documentation validation pass

1. Every relative Markdown link resolves.
2. No contradictory status claims across files.
3. No planned feature described as implemented.
4. Mockups/synthetic data (`src/data/landing-sample-data.ts`, the
   `src/components/product/*` previews) are clearly labeled as illustrative,
   never as working capability.
5. Current architecture stays separated from intended/deferred
   architecture.
6. Selected technologies stay separated from installed/configured/connected
   ones.
7. Search for secrets, tokens, credentials, private customer data, unsafe
   environment values.
8. The locked promise and MVP exclusions are unchanged.
9. Re-run `npm run lint && npm run typecheck && npm test && npm run build`
   before claiming any of them pass.
10. Inspect the final `git diff` — confirm only intended documentation
    files changed.

## Metadata convention

Every canonical document in this package carries: Owner (Andrey Grubin),
Status, Last verified date, and — where meaningful — the commit SHA it was
verified against. Don't bump the date without actually re-verifying the
content; a stale-but-honest date is more useful than a fresh-looking lie.

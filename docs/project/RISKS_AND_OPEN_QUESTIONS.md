# Skumetra — Risks and Open Questions (Public)

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-05

This is the public-safe subset. Internal risk detail (anything touching
business strategy) lives in `docs/private/RISKS_AND_OPEN_QUESTIONS.md` on
the local-only `docs/private` branch — see `PROJECT_INDEX.md`.

| ID | Risk or question | Type | Impact | Current evidence | Owner | Next action | Status |
|---|---|---|---|---|---|---|---|
| R-P01 | Tablet (768px) / large-desktop (1024px+) breakpoints not manually verified | Technical/UX | Low — fluid CSS designed to scale continuously, both endpoints checked | `LAUNCH_CHECKLIST.md` | Unassigned | Manual inspection at both widths | Open, low impact |
| R-P02 | TOCTOU race in duplicate-email detection (check-then-insert, not atomic) | Technical | Low — acceptable for a review queue today | `src/app/api/pilot-application/route.ts` | Unassigned | Add a DB unique constraint + upsert if it ever matters | Open, low priority |
| R-P03 | Legal entity name, business mailing address, and governing-law jurisdiction undocumented anywhere in the project | Legal | Blocks counsel review of `/privacy` and `/terms` | `LAUNCH_CHECKLIST.md`, `src/app/privacy/page.tsx` comments | Andrey | Supply the missing details, then get counsel review | Open, blocking a compliant launch (not blocking current validation use) |
| R-P04 | No Cloudflare Turnstile — honeypot + rate limiting are the only spam protection | Security | Currently acceptable; becomes relevant if spam volume increases | `.env.example`, `LAUNCH_CHECKLIST.md` | Unassigned | Add Turnstile if/when a site key is available and spam becomes a real problem | Open, non-blocking |
| R-P05 | GitHub-side security controls (branch protection, Dependabot, CodeQL) unverified from repository files | Process | Unknown until checked | No repo evidence either way | Andrey | Check directly in GitHub UI/API | Not decided |
| Q-P01 | Flat vs. nested `/docs` structure (`CLAUDE_PROJECT_PROMPT.md` §8) never explicitly confirmed by name | Process | Low — current flat structure works, reorganizing later is possible | `DECISION_LOG.md` | Andrey | Confirm current structure is fine, or request reorganization | Proposed — confirmation required |
| Q-P02 | Whether `skumetra.com`'s Vercel domain configuration should be independently re-checked periodically (e.g., after DNS changes) | Operational | Low | Verified once, 2026-08-05 | Andrey | None currently needed | Non-blocking |

## Contradictions discovered during the 2026-08-05 documentation audit

- Two different `CLAUDE.md` files exist with unrelated content (this repo's
  vs. the parent, non-Git folder's) — resolved, see `DECISION_LOG.md`.
- Two release-numbering schemes existed in the source planning documents —
  resolved, see `DECISION_LOG.md`.
- A prior documentation branch (`docs/project-management-baseline`) existed
  locally, unmerged, containing an earlier version of this same
  continuity system — superseded by this package and the `docs/private`
  branch; preserved, not deleted, as historical record.

# Skumetra — Product Baseline

**Owner:** Andrey Grubin · **Status:** Locked (see below) · **Last verified:** 2026-08-05
**Authority:** `../../CLAUDE_PROJECT_PROMPT.md` (parent folder, not
version-controlled) is authoritative for everything in this file. This is a
summary with links, not a replacement.

## Locked promise

> Skumetra helps Amazon sellers detect supplier stock and cost changes
> before they cause unprofitable or unavailable sales.

Verified word-for-word against `../../CLAUDE_PROJECT_PROMPT.md`. Do not
change, broaden, reinterpret, or replace this without Andrey's explicit
approval.

## Primary customer

Active Amazon US sellers who buy from suppliers via file-based workflows
(CSV/Excel/email/portal), currently listing SKUs on Amazon.

## Positioning — what Skumetra is not

Explicitly **not**: a generic repricer, an ERP, a supplier marketplace, a
product-research course, a broad dropshipping platform, or an autonomous
Amazon agent. It is supplier-aware and seller-controlled.

## Core workflow (target state, not all built yet)

A seller uploads an Amazon listing export and a supplier file. Skumetra
matches products across the two, detects supplier stock/cost changes, and
surfaces recommendations. The seller reviews and manually applies any
resulting Amazon changes — **Skumetra never updates Amazon automatically.**
See [`CURRENT_STATUS.md`](CURRENT_STATUS.md) for what of this actually
exists today (very little of the analysis pipeline — see "Deferred" there).

## Required MVP capabilities (full list)

See `../../CLAUDE_PROJECT_PROMPT.md` for the complete, authoritative list.
At a high level: file-based Amazon + supplier import, column mapping,
product matching (exact + AI-assisted), deterministic financial
calculations (minimum safe price, margin), stock/cost change detection,
protection rules, alerts/recommendations, and seller-approved manual
action — none of which are built yet except the illustrative previews
noted in `CURRENT_STATUS.md`.

## Explicit exclusions (do not build without a fresh decision)

- No automatic Amazon updates — ever. Sellers review and act manually.
- Financial calculations must be deterministic — never computed by AI.
- AI's role is bounded to: mapping assistance, matching, duplicate
  detection, comparison, explanations, and prioritization. AI must **not**
  calculate final financial values, independently decide prices, approve
  uncertain matches, override rules, or take seller actions.
- No invented customers, testimonials, integrations, certifications,
  partnerships, traction, or financial results — anywhere, including in
  this documentation.
- Do not broaden into an all-in-one marketplace platform.

## Pilot offer, validation targets, and kill/pivot criteria

These are business-sensitive by explicit decision (pricing hypotheses,
numeric success targets, and kill criteria are not published here) — see
`docs/private/VALIDATION_AND_PRICING.md` on the local-only `docs/private`
branch. What **is** public: the Founding Seller Pilot terms are already
live on `/pilot` and locked in the repo's `README.md` — do not change them
without Andrey's approval.

## Critical scope test

Before adding anything to this product, check: does it require a seller to
have already uploaded real Amazon + supplier files? If a feature doesn't
depend on that file-based core loop, it's very likely out of scope for the
MVP — flag it rather than build it.

# Skumetra — Data and Business Rules

**Owner:** Andrey Grubin · **Status:** Active, mostly "Planned — requiring decision" · **Last verified:** 2026-08-05

## What's implemented today

The only real data entity in the system is a pilot application. Full schema
(from `supabase/migrations/0001_create_pilot_applications.sql`):

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` |
| `created_at` | timestamptz | defaults to `now()` |
| `name`, `email`, `business_name` | text | `email` required, others per form |
| `amazon_selling_status`, `listing_count_range`, `supplier_count`, `supplier_file_format`, `primary_problem`, `file_willingness` | text | enum-constrained client/server-side via Zod, not via a DB check constraint |
| `additional_details` | text, nullable | free-text comments |
| `status` | text | `'new' \| 'reviewing' \| 'accepted' \| 'rejected'`, DB check constraint, defaults `'new'` |
| `source` | text | defaults `'website'` |

RLS is enabled with **zero permissive policies** — only the server-side
secret key can touch this table (see `ARCHITECTURE.md`). Indexed on
`created_at desc` and `(email, created_at desc)`.

## Core entities and relationships (planned, not implemented)

Per `../../Skumetra_MVP_Workflow.md` and
`../../Skumetra_MVP_First_Application_Pages.md`: Amazon listings, supplier
products, product matches, product analysis (stock/cost/margin signals),
protection rules, alerts, and seller decisions/activity history. None of
these have a database table, type, or processing code yet — the
`src/components/product/*` preview components use hand-authored fictional
data in `src/data/landing-sample-data.ts`, not any of these entities.

## AI permissions and prohibitions

Per `PRODUCT_BASELINE.md` — restated here as the concrete rule for any
future data-processing code:

- **Allowed:** mapping assistance, product matching, duplicate detection,
  comparison, explanations, prioritization.
- **Prohibited:** calculating final financial values, independently
  deciding prices, approving uncertain matches, overriding rules, taking
  seller actions.

## Deterministic financial-rule boundary

**Required — not yet implemented, no formula exists yet.** Minimum-safe-price
and margin calculations must be deterministic (ordinary code, not an AI
call). No exact formula, fee model, rounding rule, precedence rule, or
threshold is defined anywhere in the repository or the source planning
documents at the level of precision needed to implement it. **This needs an
explicit decision from Andrey before Release 3 calculation work starts** —
do not invent a formula to fill the gap.

## Data freshness expectations

Not yet defined — depends on the not-yet-built import/refresh mechanism.
No assumption should be made about how often data is expected to update
until that mechanism exists.

## Match confidence concepts

Referenced in the source planning documents (AI-assisted matching with a
confidence score) but no scoring method, thresholds, or UI behavior is
defined precisely enough to implement. Flag as requiring a decision when
Release 3 matching work starts.

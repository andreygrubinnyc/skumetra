# Skumetra — Data and Business Rules

**Owner:** Andrey Grubin · **Status:** Active, mostly "Planned — requiring decision" · **Last verified:** 2026-08-14

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
`src/components/product/*` preview components render fictional data from
`src/data/landing-sample-data.ts`, not any of these entities. The safe
prices in that sample data are computed by `calc-v1` (below) rather than
hand-authored, and a test fails if any of them drifts.

## AI permissions and prohibitions

Per `PRODUCT_BASELINE.md` — restated here as the concrete rule for any
future data-processing code:

- **Allowed:** mapping assistance, product matching, duplicate detection,
  comparison, explanations, prioritization.
- **Prohibited:** calculating final financial values, independently
  deciding prices, approving uncertain matches, overriding rules, taking
  seller actions.

## Deterministic financial-rule boundary — `calc-v1`

**The formula structure is approved.** Financial calculations are
deterministic ordinary code, never an AI call — AI does not calculate or
override a safe price, and must not be introduced into this path.

```
non_percentage_cost       = supplier_cost + supplier_shipping
                          + fixed_marketplace_fee + fulfillment_cost
                          + additional_fixed_cost_buffer
effective_percentage_cost = marketplace_percentage_fee
                          + additional_percentage_cost
profit_floor_price        = (non_percentage_cost + minimum_dollar_profit)
                          / (1 - effective_percentage_cost)
margin_floor_price        = non_percentage_cost
                          / (1 - effective_percentage_cost - minimum_margin_percentage)
minimum_safe_price        = max(profit_floor_price, margin_floor_price,
                                optional_absolute_minimum_price)
```

Confirmed definitions:

- Percentage fees apply to the **selling price**, not to cost — which is
  why the safe price is solved algebraically rather than added up.
- **Estimated margin means estimated profit divided by selling price.**
- **Both** the minimum-dollar-profit and minimum-margin rules must be
  satisfied; the **higher required floor controls**.
- Full precision is carried internally and the final safe price is
  **rounded up to the next cent, never downward** — rounding a threshold
  down can leave a price that misses the seller's configured minimum
  looking compliant.

**What is implemented:** a small deterministic utility,
`src/lib/calc/safe-price.ts`, used to generate and verify the fictional
landing-page samples so the displayed numbers are reproducible from the
displayed rules. **The production analysis engine is not implemented** —
no file processing, matching, persistence, alerting, or seller-specific
calculation exists. That remains Release 3 scope.

**Still pending decisions:** production fee and shipping defaults,
missing-data behavior, maximum-price conflict behavior, and other
edge-case rules. Approving the formula *structure* did not approve those
*inputs* — do not invent them.

## Data freshness expectations

Not yet defined — depends on the not-yet-built import/refresh mechanism.
No assumption should be made about how often data is expected to update
until that mechanism exists.

## Match confidence concepts

Referenced in the source planning documents (AI-assisted matching with a
confidence score) but no scoring method, thresholds, or UI behavior is
defined precisely enough to implement. Flag as requiring a decision when
Release 3 matching work starts.

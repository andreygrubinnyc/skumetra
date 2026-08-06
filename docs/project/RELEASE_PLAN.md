# Skumetra — Release Plan

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-05
**Authority:** Four-release sequence confirmed by Andrey 2026-08-05,
superseding the three-release scheme in `../../Skumetra_MVP_Product_Brief.md`
§19. See `DECISION_LOG.md`.

## Release 1 — Public Validation Site — **Current, largely complete**

**Purpose:** Validate interest before building the functional product.

**Includes:** public landing page, Founding Seller Pilot application page,
logo/favicon, sample-data product previews (fictional), client-side
validation, form submission, Privacy/Terms, Vercel deployment.

**Status:** Done, and exceeded — form submission is real (Supabase-backed),
not simulated, and Privacy/Terms have real content, not placeholders. See
`CURRENT_STATUS.md` for exact detail and caveats (legal review still
pending, two breakpoints not manually checked).

**Exit criteria:** live production URL, all routes load without console
errors, pilot form works end-to-end. **Met** as of 2026-08-05.

## Release 2 — Interactive Product Demonstration — Not started

**Purpose:** Build the Skumetra application screens using realistic sample
data, so prospects and pilot participants can see the intended workflow
before real file processing exists.

**Includes:** Dashboard, Action Center, Products, Imports, Product Matching,
Suppliers, Protection Rules, Activity, basic Settings — using illustrative,
not real, data. Real file processing is explicitly **not** required for
this release.

**Status:** Not started as application screens beyond what already exists —
`src/components/product/*` already has static illustrative previews of
Dashboard/Action Center/Product Matching/Protection Rules built as part of
the Release 1 landing page, but these aren't yet organized as a distinct,
navigable "demonstration" experience.

**Dependencies:** breaking `../../Skumetra_MVP_First_Application_Pages.md`
and `../../Skumetra_MVP_Workflow.md` down into page-level specs — not yet
done.

**Exit criteria:** not yet defined precisely; will need a decision on scope
before starting.

## Release 3 — Functional Concierge MVP — Not started (except one item)

**Purpose:** The actual working product — real data in, real analysis out.

**Includes:** Authentication, database (beyond the single
`pilot_applications` table), private file storage, real CSV/Excel
processing, column mapping, product matching, deterministic financial
calculations, alert generation, persistent user decisions, **real pilot
application storage.**

**Status:** "Real pilot application storage" is **done** — built ahead of
schedule as part of properly completing Release 1 (see `DECISION_LOG.md`).
Everything else in this release — auth, general database, file storage,
CSV/Excel processing, matching, calculations, alerts — is **not started**;
no code, dependency, or schema exists for any of it.

**Dependencies:** Supabase Auth/Storage provisioning; a deterministic
financial-formula decision (see `DATA_AND_BUSINESS_RULES.md` — no formula
is defined anywhere yet).

**Exit criteria:** not yet defined precisely.

## Release 4 — Pilot-Ready Product — Not started

**Purpose:** Operational readiness for running real, paying pilots at
scale.

**Includes:** repeat imports, saved mappings, background jobs, email
summaries, subscription controls, usage limits, error monitoring
(Sentry — boundary already prepared, not connected), improved onboarding,
basic administration.

**Status:** Not started, except the Sentry/PostHog **boundaries** (not
connections) prepared in Release 1 work — see `TECHNOLOGY_STACK.md`.

**Dependencies:** Release 3 complete.

**Exit criteria:** not yet defined precisely.

## What this plan does not do

It doesn't convert every future capability into a current commitment.
Releases 2–4 are directional, not scheduled — see `CURRENT_STATUS.md` for
what's actually being worked on right now.

# Skumetra — Public Validation Site

Live at [skumetra.com](https://skumetra.com). Release 1 of the Skumetra
product plan: a public landing page and Founding Seller Pilot application,
with a real (not simulated) backend for the pilot form.

> **Product promise (locked):** Skumetra helps Amazon sellers detect supplier
> stock and cost changes before they cause unprofitable or unavailable sales.
> It is **not** a repricer, marketplace, product-research tool, autonomous
> seller, or dropshipping platform. See [Copy rules](#copy-rules) before
> editing any text.

For the full picture of what's implemented, what's planned, and what's
deliberately deferred, start at
[`PROJECT_INDEX.md`](PROJECT_INDEX.md) — this README is developer
onboarding, not a status record; if it and
[`docs/project/CURRENT_STATUS.md`](docs/project/CURRENT_STATUS.md) ever
disagree, `CURRENT_STATUS.md` wins.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — a normal
  server-capable app deployed to Vercel, not a static export.
- **Tailwind CSS v4** — design tokens live in [`src/app/globals.css`](src/app/globals.css) (`@theme`)
- **React Hook Form + Zod** — shared client/server validation, including for the pilot form
- **Supabase** — Postgres storage for pilot applications, server-only client
- **lucide-react** — icons
- **IBM Plex Sans / Mono** via `next/font`
- **Vitest + React Testing Library** — unit & component tests
- **Playwright** — end-to-end + accessibility tests

UI primitives in [`src/components/ui`](src/components/ui) follow the **shadcn/ui**
convention (the `cn()` helper in [`src/lib/utils.ts`](src/lib/utils.ts) merges Tailwind
classes); the accessible Accordion and Tabs are hand-authored against the token system
rather than pulled from the registry, so there is no `shadcn` config to keep in sync.

## Installation

Requires Node.js 18.18+ (tested on Node 22).

```bash
npm install
```

## Local development

```bash
npm run dev
```

Open http://localhost:3000. No environment variables are required — without
Supabase configured, the pilot-application route handler uses an in-memory
fallback store (not durable — see
[`src/lib/services/pilot-application-fallback-store.ts`](src/lib/services/pilot-application-fallback-store.ts)).
Copy `.env.example` to `.env.local` to develop against a real Supabase
project.

## Build

```bash
npm run build   # production build
npm run start   # serve the production build
```

## Tests

```bash
npm run typecheck        # tsc --noEmit
npm run test             # Vitest unit + component tests
npm run test:watch       # Vitest in watch mode
npm run test:e2e:install # one-time: download Playwright browsers
npm run test:e2e         # Playwright e2e (builds + serves on :3100 automatically)
```

- **Unit:** Zod schema, rate limiter, pilot-application repository +
  in-memory fallback store, submission adapter, Route Handler (mocked
  Supabase client), `formatUsd`/`cn`.
- **Component:** pilot form (validation, error summary + focus, loading,
  success, error), FAQ accordion, product-preview tab switching.
- **E2E + accessibility:** [`tests/e2e/skumetra.spec.ts`](tests/e2e/skumetra.spec.ts), [`tests/e2e/accessibility.spec.ts`](tests/e2e/accessibility.spec.ts).

## Project structure

```
src/
  app/
    layout.tsx              # fonts, metadata, skip link
    page.tsx                # landing page (section composition)
    pilot/page.tsx          # /pilot application page
    privacy/ terms/         # real MVP-stage legal content (not counsel-reviewed — see LAUNCH_CHECKLIST.md)
    api/pilot-application/  # real Route Handler — validates, checks honeypot/rate limit/duplicates, inserts into Supabase
    globals.css             # design tokens (@theme) + base styles
    sitemap.ts  robots.ts   # SEO
  components/
    brand/                  # SkumetraLogo + SkumetraMark (inline SVG)
    layout/                 # site-header, mobile-navigation, site-footer
    landing/                # one file per landing section
    product/                # illustrative previews using fictional sample data — not working features
    pilot/                  # pilot-application-form, pilot-success-state
    analytics/              # page-view tracking (no-op until PostHog is configured)
    ui/                     # button, section, accordion, tabs (shadcn-style)
  data/
    content.ts               # approved marketing copy
    landing-sample-data.ts   # fictional demo data for previews
    faq-data.ts               # FAQ content
  lib/
    validation/pilot-application-schema.ts   # shared Zod schema + select options
    services/pilot-submission.ts             # client-side submission adapter (calls the real API route)
    services/pilot-application-repository.ts # Supabase-backed data layer
    services/pilot-application-fallback-store.ts # in-memory fallback when Supabase isn't configured
    supabase/server-client.ts                # server-only Supabase client factory
    security/rate-limiter.ts                 # basic in-memory per-IP rate limiting
    monitoring/                              # Sentry/PostHog boundaries, prepared but inactive
    utils.ts                                 # cn(), formatUsd()
  types/                    # landing.ts, pilot.ts
public/                     # favicon.svg, icon-32/48.png, apple-touch-icon.png
supabase/migrations/        # database schema
tests/e2e/                  # Playwright specs
docs/project/                # project documentation package — start at PROJECT_INDEX.md
```

## How the pilot form works

`POST /api/pilot-application` ([`src/app/api/pilot-application/route.ts`](src/app/api/pilot-application/route.ts))
re-validates with the same Zod schema server-side, checks a honeypot field,
applies basic per-IP rate limiting and a durable per-email duplicate check,
then inserts into Supabase — or an in-memory fallback store when Supabase
env vars aren't set (see `.env.example`). The client-side adapter is
[`src/lib/services/pilot-submission.ts`](src/lib/services/pilot-submission.ts).

## How to update sample data

All preview figures are fictional and live in
[`src/data/landing-sample-data.ts`](src/data/landing-sample-data.ts). The hero preview,
Action Center table, and Protection Rules panel describe **the same imaginary account**.

**Do not hand-edit a safe price.** Every `minimumSafePrice` is computed by the
approved `calc-v1` formula in [`src/lib/calc/safe-price.ts`](src/lib/calc/safe-price.ts)
from that product's supplier cost and the shared `SAMPLE_RULES` assumption set.
To change a sample, change the supplier cost or the rules — the tests in
[`landing-sample-data.test.ts`](src/data/landing-sample-data.test.ts) recompute the
expectation and fail if a displayed figure no longer follows from the displayed
rules. `SAMPLE_RULES` are fictional demonstration assumptions, **not** Amazon's real
fee schedule and not production defaults.

Types are in [`src/types/landing.ts`](src/types/landing.ts). Never paste real seller
or customer data.

Marketing copy lives in [`src/data/content.ts`](src/data/content.ts) and FAQ entries in
[`src/data/faq-data.ts`](src/data/faq-data.ts).

## Deployment

Live at `https://skumetra.com` (Vercel), deploying automatically from
`main`. See
[`docs/project/DEPLOYMENT_AND_OPERATIONS.md`](docs/project/DEPLOYMENT_AND_OPERATIONS.md)
for the full setup, environment variables, and domain configuration.

## Copy rules

- The hero headline and the **$39 / 30-day**, **100-SKU** pilot terms are **locked** — do
  not change them.
- No invented metrics, testimonials, customer logos, "trusted by" sections, fake
  integrations, launch dates, or certification/security claims (no SOC 2, ISO,
  bank-/enterprise-grade).
- No Sign In link and no `/signin` route until authentication exists.
- `/privacy` and `/terms` have real content but are **not** counsel-reviewed
  — see [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md).

## Known MVP limitations

- **No authentication / accounts / dashboard** — the app frame is a static preview.
- **No file upload or real analysis** — the "product" previews under
  `src/components/product/` are illustrative sample data, not a working
  feature.
- **Legal pages have real content but are not counsel-reviewed** — missing
  the registered legal entity name, mailing address, and governing-law
  jurisdiction, none of which are documented anywhere in this project.
- **Analytics and error monitoring are prepared but inactive** (no key/DSN set).
- **No Cloudflare Turnstile yet** — honeypot + rate limiting are the current spam protection.
- Not connected to Amazon, Stripe, or any external service beyond Supabase and Vercel.

## License

MIT — see [LICENSE](LICENSE). The Skumetra name, logo, and brand are not
covered by this license.

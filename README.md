# Skumetra — Landing Page & Founding Seller Pilot

Frontend implementation of the approved Skumetra landing page and Founding Seller
Pilot application. **Frontend-only MVP** — there is no backend yet, but the code is
structured so real lead capture (Supabase or an API) drops into a single adapter.

> **Product promise (locked):** Skumetra helps Amazon sellers detect supplier stock
> and cost changes before they cause unprofitable or unavailable sales. It is **not**
> a repricer, marketplace, product-research tool, autonomous seller, or dropshipping
> platform. See [Copy rules](#copy-rules) before editing any text.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — design tokens live in [`src/app/globals.css`](src/app/globals.css) (`@theme`)
- **React Hook Form + Zod** — pilot application form & validation
- **lucide-react** — icons
- **IBM Plex Sans / Mono** via `next/font`
- **Vitest + React Testing Library** — unit & component tests
- **Playwright** — end-to-end tests

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

Open http://localhost:3000.

## Build

```bash
npm run build   # production build (all routes are static)
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

- **Unit:** Zod schema, mock submission service, `formatUsd`/`cn`, severity/status data.
- **Component:** pilot form (validation, error summary + focus, loading, success, error),
  FAQ accordion (mouse + keyboard), product-preview tab switching.
- **E2E:** the eight scenarios in [`tests/e2e/skumetra.spec.ts`](tests/e2e/skumetra.spec.ts).

## Project structure

```
src/
  app/
    layout.tsx              # fonts, metadata, skip link
    page.tsx                # landing page (section composition)
    pilot/page.tsx          # /pilot application page
    privacy/ terms/         # placeholder legal routes (noindex)
    globals.css             # design tokens (@theme) + base styles
    sitemap.ts  robots.ts   # SEO
  components/
    brand/                  # SkumetraLogo + SkumetraMark (inline SVG)
    layout/                 # site-header, mobile-navigation, site-footer
    landing/                # one file per landing section
    product/                # dashboard preview, action center, matching, rules
    pilot/                  # pilot-application-form, pilot-success-state
    ui/                     # button, section, accordion, tabs (shadcn-style)
  data/
    content.ts              # approved marketing copy
    landing-sample-data.ts  # fictional demo data for previews
    faq-data.ts             # FAQ content
  lib/
    validation/pilot-application-schema.ts   # Zod schema + select options
    services/pilot-submission.ts             # submission adapter (SIMULATED)
    utils.ts                                 # cn(), formatUsd()
  types/                    # landing.ts, pilot.ts
public/                     # favicon.svg, icon-32/48.png, apple-touch-icon.png
tests/e2e/                  # Playwright specs
```

## How to replace simulated form submission

The entire integration surface is **one function**:
[`src/lib/services/pilot-submission.ts`](src/lib/services/pilot-submission.ts).

```ts
export async function submitPilotApplication(
  application: PilotApplication,
): Promise<PilotSubmissionResult>
```

Keep the signature; replace the body with a real call (e.g. `POST /api/pilot-application`
or a Supabase insert). The form imports nothing else from the service, so no component
changes are needed. **Re-validate `application` on the server with the same Zod schema**
(`pilotApplicationSchema`), and add spam protection + rate limiting before going public
(see [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md)).

> The current simulation resolves after ~1.2s and succeeds for any email except
> `fail@skumetra.test`, which deterministically exercises the error banner.

## How to update sample data

All preview figures are fictional and live in
[`src/data/landing-sample-data.ts`](src/data/landing-sample-data.ts). The hero preview,
Action Center table, and Protection Rules panel describe **the same imaginary account** —
keep them internally consistent (safe prices should follow the rules). Types are in
[`src/types/landing.ts`](src/types/landing.ts). Never paste real seller or customer data.

Marketing copy lives in [`src/data/content.ts`](src/data/content.ts) and FAQ entries in
[`src/data/faq-data.ts`](src/data/faq-data.ts).

## How to deploy to Vercel

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Vercel, **New Project → Import** the repo. Framework preset auto-detects **Next.js**;
   build command `next build`, output handled automatically. No env vars are required for
   the frontend-only MVP.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL once the domain is attached (used for
   canonical/OG/sitemap). See [`.env.example`](.env.example).
4. Deploy a **Preview** first, run through [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md), and
   only promote to Production after approval.

CLI alternative:

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production (after approval)
```

## Copy rules

- The hero headline and the **$39 / 30-day**, **100-SKU** pilot terms are **locked** — do
  not change them.
- No invented metrics, testimonials, customer logos, "trusted by" sections, fake
  integrations, launch dates, or certification/security claims (no SOC 2, ISO,
  bank-/enterprise-grade).
- No Sign In link and no `/signin` route until authentication exists.
- `/privacy` and `/terms` are **placeholders** and must be completed before public launch.

## Known MVP limitations

- **No backend.** Pilot submissions are simulated and never persisted (see above).
- **No authentication / accounts / dashboard** — the app frame is a static preview.
- **No file upload or real analysis** — the "product" is illustrative sample data.
- **Legal pages are placeholders** — Privacy and Terms are not written.
- **No analytics, error monitoring, spam protection, or rate limiting** yet.
- Not connected to Amazon, Supabase, Stripe, or any external service.

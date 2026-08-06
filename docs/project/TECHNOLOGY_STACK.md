# Skumetra — Technology Stack

**Owner:** Andrey Grubin · **Status:** Active · **Last verified:** 2026-08-05
**Verified against:** `package.json` on commit `31091a7`, plus this
session's live testing against production.

A technology-selection document (`../../Skumetra_MVP_Technology_Selection.md`)
is source rationale, not proof of installation — this table reflects only
what's actually in the repository or independently verified live.

| Technology | Intended role | Selected | Installed | Configured | Connected/verified | Evidence |
|---|---|---:|---:|---:|---:|---|
| Next.js | App framework | Yes | Yes (16.3.0) | Yes | Yes | `package.json`; live at skumetra.com |
| TypeScript | Language | Yes | Yes (5.7) | Yes | Yes | `tsconfig.json`; `npm run typecheck` clean |
| React | UI library | Yes | Yes (19.0) | Yes | Yes | `package.json` |
| Tailwind CSS | Styling | Yes | Yes (v4) | Yes | Yes | `src/app/globals.css` (`@theme` tokens) |
| shadcn/ui | UI primitive convention | Yes | Convention only, not the CLI/registry | Yes | Yes | `src/components/ui/` hand-authored against the token system; `cn()` helper in `src/lib/utils.ts` |
| Supabase PostgreSQL | Pilot-application storage | Yes | Yes (`@supabase/supabase-js` 2.112) | Yes | Yes | `supabase/migrations/0001_create_pilot_applications.sql`; verified real inserts in production 2026-08-05 |
| Supabase Auth | User authentication | Yes (future) | No | No | No | No `supabase.auth` usage anywhere in `src/` |
| Supabase Storage | Private file storage | Yes (future) | No | No | No | No Storage client code found |
| Vercel | Hosting | Yes | N/A (platform) | Yes | Yes | Live at skumetra.com, skumetra.vercel.app |
| GitHub | Source control / CI | Yes | N/A (platform) | Yes | Partially | Public repo + Actions CI confirmed; branch protection/Dependabot/CodeQL **unverified from repo files** — see `TESTING_AND_SECURITY.md` |
| Zod | Validation | Yes | Yes (3.24) | Yes | Yes | `src/lib/validation/pilot-application-schema.ts`, shared client+server |
| Decimal.js | Deterministic financial math | Yes (future) | No | No | No | No dependency; no calculation code exists yet |
| OpenAI API | AI-assisted matching/explanation | Yes (future) | No | No | No | No dependency, no AI code |
| Stripe | Subscriptions | Yes (future) | No | No | No | No dependency |
| Resend (or similar) | Email delivery | Yes (future) | No | No | No | No dependency |
| PostHog | Product analytics | Yes | No (boundary only) | Partially | No | `src/lib/monitoring/analytics.ts` — no-op until `NEXT_PUBLIC_POSTHOG_KEY` is set |
| Sentry | Error monitoring | Yes | No (boundary only) | Partially | No | `src/lib/monitoring/error-reporting.ts` — logs to console until `SENTRY_DSN` is set and `@sentry/nextjs` installed |
| Vitest | Unit/component testing | Yes | Yes (4.1) | Yes | Yes | 76/76 passing as of 2026-08-05 |
| React Testing Library | Component testing | Yes | Yes (16.1) | Yes | Yes | Used across `*.test.tsx` files |
| Playwright | E2E/accessibility testing | Yes | Yes (1.49) | Yes | Not re-verified in this pass | `tests/e2e/skumetra.spec.ts`, `accessibility.spec.ts`; last known result 24/24, not re-run today |

## Not selected / no evidence found

Cloudflare Turnstile is referenced in `.env.example` as commented-out —
selected as the likely next spam-protection layer, but no site key
available and not installed.

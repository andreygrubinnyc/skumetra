# Skumetra — Launch-Readiness Checklist

This build is a **frontend-only preview**. Everything below must be resolved before
collecting real applications or promoting to production. Do not enable public
application submissions while any 🔴 item is open.

## 🔴 Blockers (must complete before any public data collection)

- [x] **Replace simulated pilot form with real submission storage** — `POST
      /api/pilot-application` validates with `pilotApplicationSchema` server-side and
      inserts into Supabase (`supabase/migrations/0001_create_pilot_applications.sql`).
      Requires `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` to be set in the
      deployment environment — without them, submissions go to an in-memory fallback
      store that is **not durable** (see `.env.example`).
- [x] **Complete the Privacy Policy** (`src/app/privacy/page.tsx`) — real MVP-stage
      content. **Missing:** registered legal entity name and business mailing address
      are not documented anywhere in this project, so neither is stated. Add both, then
      have the page reviewed by counsel before relying on it as a compliant policy.
- [x] **Complete the Terms of Service** (`src/app/terms/page.tsx`) — same caveat: legal
      entity name, mailing address, and governing-law jurisdiction are not documented and
      are not stated on the page. Same counsel review needed before launch.
- [x] **Configure spam protection** — honeypot field implemented
      (`src/components/pilot/pilot-application-form.tsx`), checked server-side. Cloudflare
      Turnstile was **not** added (no site key available) — documented as the next
      enhancement in `RISKS_AND_DEPENDENCIES.md`.
- [x] **Configure rate limiting** — basic in-memory per-IP limiter
      (`src/lib/security/rate-limiter.ts`, resets on cold start — not durable across
      serverless instances) plus a durable per-email duplicate check backed by the
      database (`findRecentApplicationId`).
- [x] **Confirm no customer PII is collected unintentionally** — the form collects only
      business contact + qualification fields. The Privacy Policy explicitly asks
      applicants not to submit Amazon passwords or Amazon customer PII.

## 🟠 Pre-launch

- [ ] **Configure production analytics** — boundary prepared
      (`src/lib/monitoring/analytics.ts`), not connected. Set `NEXT_PUBLIC_POSTHOG_KEY`
      to activate; currently a no-op.
- [ ] **Configure error monitoring** — boundary prepared
      (`src/lib/monitoring/error-reporting.ts`), logs to console/Vercel function logs
      until real Sentry is wired up (needs `npm install @sentry/nextjs` + a DSN).
- [ ] **Verify domain email** — `hello@skumetra.com` mailbox exists and is monitored.
- [ ] **Set `NEXT_PUBLIC_SITE_URL`** to the production domain (canonical/OG/sitemap) —
      already correct in `.env.example`; confirm it's set in the actual Vercel project.
- [ ] **Set `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`** in the Vercel
      project — without them, pilot submissions use the non-durable in-memory fallback.
- [ ] **Run the Supabase migration** (`supabase/migrations/0001_create_pilot_applications.sql`)
      against the real project before setting the above.
- [ ] **Verify favicon files** — `favicon.svg`, `icon-32.png`, `icon-48.png`,
      `apple-touch-icon.png` render correctly in browser tabs and on iOS.
- [ ] **Test mobile layout** at 375 / 768 / 1024 / 1440 (no horizontal scroll). 375px and
      ~1600px desktop manually verified; 768/1024 not yet manually inspected.
- [ ] **Run an accessibility review** (keyboard nav, focus order, contrast, screen reader) —
      automated axe-core coverage exists (0 violations); manual screen-reader pass not done.
- [ ] **Run a link check** (internal anchors, `mailto:`, footer links).
- [ ] **Consider Cloudflare Turnstile** on the pilot form — honeypot + rate limiting are
      live now; Turnstile is the natural next layer if spam becomes a real problem.
- [ ] **Address the TOCTOU race in duplicate detection** — two near-simultaneous
      submissions with the same email could both insert (check-then-insert, not atomic).
      Low severity for a review queue; a DB unique constraint + upsert would close it if
      it ever matters.

## 🟢 Content & compliance sign-off

- [ ] **Confirm no invented claims** — no testimonials, customer logos, "trusted by",
      fabricated metrics, fake integrations, launch dates, or certification/security claims.
- [ ] Confirm the **locked** items are unchanged: hero headline, **$39 / 30 days**,
      **100-SKU** pilot limit.
- [ ] Confirm there is **no Sign In** link/route and no purchasable Starter/Growth/Pro plans.
- [ ] Confirm positioning is intact (supplier-aware stock/cost/margin protection — not a
      repricer, marketplace, product-research tool, autonomous seller, or dropshipping platform).

## 🚀 Deploy

- [ ] **Deploy to a Vercel Preview** and smoke-test all routes — not yet done; needs
      Andrey's Vercel account authentication (Claude cannot complete an interactive
      login). GitHub Actions CI (`.github/workflows/ci.yml`) runs lint/typecheck/test/build
      on every PR and push to `main`.
- [x] `npm run build`, `npm run test`, and Playwright e2e all pass locally.
- [ ] **Obtain approval before production launch**, then `vercel --prod`.

---

### Development warning

`/privacy` and `/terms` now render real MVP-stage content instead of placeholders, but
both are still missing a registered legal entity name and business mailing address (see
the 🔴 items above) and have not been reviewed by counsel. Do not treat them as a
complete, compliant policy until that review happens.

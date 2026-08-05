# Skumetra — Launch-Readiness Checklist

This build is a **frontend-only preview**. Everything below must be resolved before
collecting real applications or promoting to production. Do not enable public
application submissions while any 🔴 item is open.

## 🔴 Blockers (must complete before any public data collection)

- [ ] **Replace simulated pilot form with real submission storage**
      (`src/lib/services/pilot-submission.ts` → real API/Supabase; re-validate with
      `pilotApplicationSchema` on the server).
- [ ] **Complete the Privacy Policy** (`src/app/privacy/page.tsx` is a placeholder).
- [ ] **Complete the Terms of Service** (`src/app/terms/page.tsx` is a placeholder).
- [ ] **Configure spam protection** (e.g. Cloudflare Turnstile / hCaptcha, honeypot).
- [ ] **Configure rate limiting** on the submission endpoint.
- [ ] **Confirm no customer PII is collected unintentionally** — the form collects only
      business contact + qualification fields; verify no extra data is logged/stored.

## 🟠 Pre-launch

- [ ] **Configure production analytics** (privacy-respecting; e.g. Plausible/Vercel Analytics).
- [ ] **Configure error monitoring** (e.g. Sentry).
- [ ] **Verify domain email** — `hello@skumetra.com` mailbox exists and is monitored.
- [ ] **Set `NEXT_PUBLIC_SITE_URL`** to the production domain (canonical/OG/sitemap).
- [ ] **Verify favicon files** — `favicon.svg`, `icon-32.png`, `icon-48.png`,
      `apple-touch-icon.png` render correctly in browser tabs and on iOS.
- [ ] **Test mobile layout** at 375 / 768 / 1024 / 1440 (no horizontal scroll).
- [ ] **Run an accessibility review** (keyboard nav, focus order, contrast, screen reader).
- [ ] **Run a link check** (internal anchors, `mailto:`, footer links).

## 🟢 Content & compliance sign-off

- [ ] **Confirm no invented claims** — no testimonials, customer logos, "trusted by",
      fabricated metrics, fake integrations, launch dates, or certification/security claims.
- [ ] Confirm the **locked** items are unchanged: hero headline, **$39 / 30 days**,
      **100-SKU** pilot limit.
- [ ] Confirm there is **no Sign In** link/route and no purchasable Starter/Growth/Pro plans.
- [ ] Confirm positioning is intact (supplier-aware stock/cost/margin protection — not a
      repricer, marketplace, product-research tool, autonomous seller, or dropshipping platform).

## 🚀 Deploy

- [ ] **Deploy to a Vercel Preview** and smoke-test all routes.
- [ ] `npm run build`, `npm run test`, and `npm run test:e2e` all pass in CI.
- [ ] **Obtain approval before production launch**, then `vercel --prod`.

---

### Development warning

`/privacy` and `/terms` render holding pages and are marked `noindex`. Their source files
carry a ⚠️ comment. The footer links to them so the design is complete, but the site must
**not** accept public applications until the two 🔴 legal items and the submission-storage
item above are done.

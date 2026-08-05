import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  robots: { index: false, follow: false },
  alternates: { canonical: '/terms' },
}

/**
 * ⚠️ PLACEHOLDER ROUTE — BLOCKS PUBLIC LAUNCH.
 * No Terms of Service text has been written. Do NOT draft legal language here;
 * it must come from the founder or counsel and be completed BEFORE public
 * application submissions are enabled. See LAUNCH_CHECKLIST.md.
 */
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-[860px] px-6 py-[clamp(56px,8vw,104px)]">
        <p className="mb-4 inline-flex items-center gap-2 rounded-chip border border-warn-border bg-warn-bg px-3 py-1.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-warn-text">
          Placeholder — not yet published
        </p>
        <h1 className="mb-5 text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.14] tracking-[-0.025em]">
          Terms of Service
        </h1>
        <p className="mb-4 max-w-[62ch] text-[17px] leading-[1.65] text-ink-soft">
          Skumetra&apos;s Terms of Service are being finalized for the Founding Seller Pilot. This page must be
          completed before public application submissions are enabled.
        </p>
        <p className="m-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-faint">
          If you need these terms before applying, email{' '}
          <a href="mailto:hello@skumetra.com">hello@skumetra.com</a> and we will send them as soon as they are
          available.
        </p>
      </main>
      <SiteFooter />
    </>
  )
}

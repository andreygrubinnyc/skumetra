import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { SkumetraLogo } from '@/components/brand/skumetra-logo'
import { PilotApplicationForm } from '@/components/pilot/pilot-application-form'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'

export const metadata: Metadata = {
  title: 'Apply for the Founding Seller Pilot',
  description:
    'The Skumetra Founding Seller Pilot is for active Amazon US sellers with live listings and usable supplier inventory or pricing data.',
  alternates: { canonical: '/pilot' },
  openGraph: {
    type: 'website',
    url: 'https://skumetra.com/pilot',
    title: 'Apply for the Founding Seller Pilot — Skumetra',
    description:
      'The Skumetra Founding Seller Pilot is for active Amazon US sellers with live listings and usable supplier inventory or pricing data.',
  },
}

const asideIncluded = [
  'Up to 100 matched SKUs',
  'Supplier stock and cost analysis',
  'Safe-price calculations and margin alerts',
  'AI-assisted product matching',
  'Limited onboarding and a weekly summary',
]

export default function PilotPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas-tint">
      <PageViewTracker event="pilot_page_viewed" />
      <header className="border-b border-line-soft bg-canvas">
        <div className="mx-auto flex h-[68px] w-full max-w-[1080px] items-center gap-5 px-6">
          <SkumetraLogo href="/" size="sm" />
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-[14.5px] text-ink-muted no-underline hover:text-ink hover:no-underline"
          >
            <ArrowLeft size={15} aria-hidden />
            Back to site
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex-1 py-[clamp(40px,6vw,72px)]">
        <div className="mx-auto w-full max-w-[1080px] px-6">
          <div className="grid grid-cols-1 items-start gap-[clamp(32px,4vw,56px)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div>
              <p className="mb-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-accent">
                Early access
              </p>
              <h1 className="mb-4 max-w-[24ch] text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.14] tracking-[-0.025em]">
                Apply for the Founding Seller Pilot
              </h1>
              <p className="mb-9 max-w-[58ch] text-[16.5px] leading-[1.6] text-ink-soft">
                The pilot is intended for active Amazon US sellers with live listings and usable supplier
                inventory or pricing data. We review each application and contact qualified participants.
              </p>
              <PilotApplicationForm />
            </div>

            {/* Hidden below 900px: the same information already appears on the landing page. */}
            <aside className="sticky top-6 hidden lg:block">
              <div className="mb-4 rounded-frame border border-accent-border-strong bg-canvas p-[26px]">
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span className="font-mono text-[32px] font-semibold tracking-[-0.03em]">$39</span>
                  <span className="text-[15px] text-ink-soft">for 30 days</span>
                </div>
                <p className="mb-5 text-[13px] leading-[1.55] text-ink-faint">
                  An early pricing hypothesis, not a final plan.
                </p>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {asideIncluded.map((i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-ink-body">
                      <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-frame border border-line bg-canvas-subtle px-[22px] py-5">
                <div className="mb-3 text-[12.5px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
                  Not included
                </div>
                <p className="m-0 text-[14px] leading-[1.6] text-ink-softer">
                  Automatic Amazon updates, automated purchasing, supplier discovery, customer-order
                  processing, custom supplier integrations, or additional marketplaces.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="bg-ink-strong py-8">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-3 px-6">
          <span className="text-[13px] text-on-dark-faint">© 2026 Skumetra. All rights reserved.</span>
          <span className="font-mono text-[13px] text-on-dark-faint">skumetra.com</span>
        </div>
      </footer>
    </div>
  )
}

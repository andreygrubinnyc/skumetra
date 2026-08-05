import { FileSpreadsheet } from 'lucide-react'
import { Shell } from '@/components/ui/section'
import { ButtonLink } from '@/components/ui/button'
import { DashboardPreview } from '@/components/product/dashboard-preview'

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-[linear-gradient(180deg,#f7fafa_0%,#ffffff_100%)] pb-[clamp(64px,8vw,104px)] pt-[clamp(56px,7vw,96px)]"
    >
      <Shell>
        <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,72px)] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
          <div>
            <p className="mb-5 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-accent">
              Supplier-aware protection for Amazon sellers
            </p>
            {/* LOCKED headline — do not reword. */}
            <h1
              id="hero-heading"
              className="mb-[22px] max-w-[19ch] text-[clamp(34px,4.4vw,56px)] font-semibold leading-[1.06] tracking-[-0.028em]"
            >
              Protect your Amazon listings from supplier stockouts and margin loss.
            </h1>
            <p className="mb-8 max-w-[56ch] text-[clamp(16.5px,1.3vw,18.5px)] leading-[1.6] text-ink-muted">
              Skumetra compares your supplier inventory and costs with your Amazon listings, calculates safe
              selling prices, and shows which products need attention.
            </p>
            <div className="mb-[18px] flex flex-wrap gap-3">
              <ButtonLink href="/pilot">Join the Founding Seller Pilot</ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary">
                See How It Works
              </ButtonLink>
            </div>
            <p className="m-0 flex items-center gap-2 text-[14.5px] text-ink-softer">
              <FileSpreadsheet size={17} className="text-accent" aria-hidden />
              Built for active Amazon sellers using supplier CSV or Excel files.
            </p>
          </div>
          <div>
            <DashboardPreview />
            <p className="m-0 mt-3 text-center text-[12.5px] text-ink-faint">
              Illustrative preview — fictional sample data, not a live account.
            </p>
          </div>
        </div>
      </Shell>
    </section>
  )
}

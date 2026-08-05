import Link from 'next/link'
import { Shell } from '@/components/ui/section'
import { ButtonLink } from '@/components/ui/button'

export function FinalCtaSection() {
  return (
    <section aria-labelledby="final-cta-heading" className="bg-ink py-[clamp(64px,8vw,104px)]">
      <Shell>
        <h2
          id="final-cta-heading"
          className="mb-5 max-w-[28ch] text-[clamp(27px,3.2vw,40px)] font-semibold leading-[1.16] tracking-[-0.024em] text-white"
        >
          Find the supplier changes that could cost you money before the next order arrives.
        </h2>
        <p className="mb-8 max-w-[58ch] text-[17px] leading-[1.65] text-on-dark-high">
          Join the Founding Seller Pilot and help shape a practical protection layer for active Amazon sellers.
        </p>
        <div className="mb-7 flex flex-wrap items-center gap-6">
          <ButtonLink href="/pilot" variant="onDark">
            Apply for the Founding Seller Pilot
          </ButtonLink>
          <Link
            href="#how-it-works"
            className="border-b border-[rgba(168,222,221,0.4)] pb-0.5 text-[15.5px] text-on-dark-link no-underline hover:text-white hover:no-underline"
          >
            Review How It Works
          </Link>
        </div>
        {/* Stands in for social proof. Do NOT replace with invented logos, counts, or testimonials. */}
        <p className="m-0 max-w-[56ch] text-[14px] leading-[1.6] text-on-dark-low">
          Currently recruiting a small group of active Amazon sellers for the Founding Seller Pilot.
        </p>
      </Shell>
    </section>
  )
}

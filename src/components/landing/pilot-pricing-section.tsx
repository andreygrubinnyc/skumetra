import { Check, X } from 'lucide-react'
import { Section, Eyebrow, SectionTitle, Lead } from '@/components/ui/section'
import { ButtonLink } from '@/components/ui/button'
import { pilotIncluded, pilotExcluded } from '@/data/content'

/**
 * Pilot and pricing are ONE section: the $39 pilot is the only purchasable thing today.
 * Never render a checkout button for hypothetical future plans, and never change the
 * $39 price or the 100-SKU limit.
 */
export function PilotPricingSection() {
  return (
    <Section id="pilot" aria-labelledby="pilot-heading">
      <Eyebrow>Early access</Eyebrow>
      <SectionTitle id="pilot-heading" className="mb-5 max-w-[22ch]">
        Join the Skumetra Founding Seller Pilot
      </SectionTitle>
      <Lead className="mb-11 max-w-[62ch]">
        Help shape the first version of Skumetra while protecting up to 100 Amazon listings from supplier stock,
        cost, and margin risks.
      </Lead>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="rounded-frame border border-accent-border-strong bg-canvas p-[30px] shadow-price">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-[20px] bg-accent-tint px-2.5 py-[5px] text-[11.5px] font-semibold uppercase tracking-[0.06em] text-accent-deep">
            Founding Seller Pilot
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-mono text-[40px] font-semibold tracking-[-0.03em]">$39</span>
            <span className="text-[16px] text-ink-soft">for 30 days</span>
          </div>
          <p className="mb-6 text-[13.5px] leading-[1.55] text-ink-faint">
            An early pricing hypothesis, not a final plan.
          </p>
          <ButtonLink href="/pilot" className="mb-5 w-full">
            Apply for the Founding Seller Pilot
          </ButtonLink>
          <p className="m-0 text-[13.5px] leading-[1.6] text-ink-soft">
            The pilot is intended for active Amazon US sellers with live listings and usable supplier inventory
            or pricing data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 border-b border-line pb-2.5 text-[13px] font-semibold uppercase tracking-[0.07em]">
              Included
            </h3>
            <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
              {pilotIncluded.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-[1.5] text-ink-body">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 border-b border-line pb-2.5 text-[13px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
              Not included
            </h3>
            <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
              {pilotExcluded.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-[1.5] text-ink-softer">
                  <X size={15} className="mt-0.5 shrink-0 text-[#9aa8aa]" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-10 max-w-[62ch] text-[13.5px] leading-[1.6] text-ink-faint">
        Skumetra does not sell Starter, Growth, or Pro plans yet. Future subscription plans will be shaped by
        pilot feedback.
      </p>
    </Section>
  )
}

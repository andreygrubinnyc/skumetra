import { Section, Eyebrow, SectionTitle } from '@/components/ui/section'
import { trustPoints } from '@/data/content'

/**
 * Accurate MVP-stage language only. Never add SOC 2, ISO, bank-grade or
 * enterprise-grade claims, and never imply an audit that has not happened.
 */
export function TrustSection() {
  return (
    <Section ground="tint" aria-labelledby="trust-heading">
      <Eyebrow>Trust and data control</Eyebrow>
      <SectionTitle id="trust-heading" className="mb-11 max-w-[22ch]">
        Your data stays under your control
      </SectionTitle>
      <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-10 gap-y-6 p-0">
        {trustPoints.map((t) => {
          const Icon = t.icon
          return (
            <li key={t.body} className="flex gap-3.5">
              <Icon size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <p className="m-0 text-[15px] leading-[1.6] text-ink-body">{t.body}</p>
            </li>
          )
        })}
      </ul>
      <p className="mb-0 mt-8 max-w-[62ch] text-[13.5px] leading-[1.6] text-ink-faint">
        Skumetra is an early-stage MVP. We describe only the protections that exist today and make no
        compliance or certification claims.
      </p>
    </Section>
  )
}

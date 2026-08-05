import { Sparkles, Lock, Check, Circle } from 'lucide-react'
import { Section, Eyebrow, SectionTitle, Lead } from '@/components/ui/section'
import { aiAssisted, ruleBased, aiBoundaries } from '@/data/content'

/** Trust section, not a feature pitch. Never describe autonomous agents. */
export function AiControlSection() {
  return (
    <Section aria-labelledby="ai-heading">
      <Eyebrow>Where AI fits</Eyebrow>
      <SectionTitle id="ai-heading" className="mb-5 max-w-[26ch]">
        AI helps interpret the data. Your rules protect the money.
      </SectionTitle>
      <Lead className="mb-11 max-w-[64ch]">
        Supplier files arrive in inconsistent shapes, and product names rarely agree across two systems. AI is
        useful for reading that ambiguity. It is not what decides your prices.
      </Lead>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-line bg-canvas p-[26px]">
          <div className="mb-[18px] flex items-center gap-2.5">
            <Sparkles size={19} className="text-accent" aria-hidden />
            <h3 className="m-0 text-[16px] font-semibold">AI-assisted</h3>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {aiAssisted.map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-[1.5] text-ink-body">
                <Circle size={7} className="mt-2 shrink-0 fill-accent text-accent" aria-hidden />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-card border border-[#dde5e5] bg-canvas-subtle p-[26px]">
          <div className="mb-[18px] flex items-center gap-2.5">
            <Lock size={19} className="text-ink" aria-hidden />
            <h3 className="m-0 text-[16px] font-semibold">Rule-based and controlled</h3>
          </div>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-5 gap-y-3 p-0">
            {ruleBased.map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-[1.5] text-ink-body">
                <Check size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-8 gap-y-3.5 p-0">
        {aiBoundaries.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[14.5px] leading-[1.55] text-ink-soft">
            <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            {b}
          </li>
        ))}
      </ul>
    </Section>
  )
}

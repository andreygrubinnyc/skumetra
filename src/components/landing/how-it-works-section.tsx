import { FileSpreadsheet, Hand } from 'lucide-react'
import { Section, Eyebrow, SectionTitle } from '@/components/ui/section'
import { steps } from '@/data/content'

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" aria-labelledby="how-heading">
      <Eyebrow>How it works</Eyebrow>
      <SectionTitle id="how-heading" className="mb-14 max-w-[22ch]">
        From supplier files to prioritized actions
      </SectionTitle>

      <ol className="m-0 mb-10 grid list-none grid-cols-1 gap-7 p-0 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={`pt-5 ${i === 0 ? 'border-t-2 border-accent' : 'border-t-2 border-line-strong'}`}
          >
            <div
              className={`mb-3 font-mono text-[12px] font-semibold tracking-[0.08em] ${
                i === 0 ? 'text-accent' : 'text-ink-faint'
              }`}
            >
              STEP {i + 1}
            </div>
            <h3 className="mb-2.5 text-[17px] font-semibold tracking-[-0.012em]">{s.title}</h3>
            <p className={`m-0 text-[14.5px] leading-[1.6] text-ink-soft ${s.files ? 'mb-4' : ''}`}>
              {s.body}
            </p>
            {s.note && <p className="m-0 text-[13.5px] leading-[1.55] text-ink-faint">{s.note}</p>}
            {s.files && (
              <div className="flex flex-col gap-2">
                {s.files.map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 rounded-chip border border-[#e6ebeb] bg-canvas-subtle px-[11px] py-[9px]"
                  >
                    <FileSpreadsheet size={16} className="text-accent" aria-hidden />
                    <span className="font-mono text-[12px] text-ink-muted">{file}</span>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 rounded-note border border-accent-border bg-accent-tint2 px-5 py-4">
        <Hand size={20} className="shrink-0 text-accent" aria-hidden />
        <p className="m-0 text-[15px] leading-[1.55] text-[#2b3a3c]">
          <strong className="font-semibold">You remain in control.</strong> The MVP does not automatically
          update Amazon.
        </p>
      </div>
    </Section>
  )
}

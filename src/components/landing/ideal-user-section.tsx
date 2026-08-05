import { CircleCheck, CircleMinus } from 'lucide-react'
import { Section, Eyebrow, SectionTitle } from '@/components/ui/section'
import { goodFit, notYet } from '@/data/content'

function FitList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-[13px] p-0">
      {items.map((i) => (
        <li
          key={i}
          className={`relative pl-[18px] text-[15px] leading-[1.5] ${muted ? 'text-ink-softer' : 'text-ink-body'}`}
        >
          <span
            aria-hidden
            className={`absolute left-0 top-2 h-1.5 w-1.5 rounded-full ${muted ? 'bg-[#c2cccd]' : 'bg-accent'}`}
          />
          {i}
        </li>
      ))}
    </ul>
  )
}

/** Qualifying, not dismissive — "Not yet" is a timing statement. */
export function IdealUserSection() {
  return (
    <Section aria-labelledby="fit-heading">
      <Eyebrow>Who it is for</Eyebrow>
      <SectionTitle id="fit-heading" className="mb-11 max-w-[26ch]">
        Built for active sellers, not people who have not started yet
      </SectionTitle>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-accent-border bg-canvas p-7">
          <div className="mb-5 flex items-center gap-2.5">
            <CircleCheck size={20} className="text-accent" aria-hidden />
            <h3 className="m-0 text-[16px] font-semibold">Good fit</h3>
          </div>
          <FitList items={goodFit} />
        </div>
        <div className="rounded-card border border-line bg-canvas p-7">
          <div className="mb-5 flex items-center gap-2.5">
            <CircleMinus size={20} className="text-ink-faintest" aria-hidden />
            <h3 className="m-0 text-[16px] font-semibold text-ink-muted">Not yet</h3>
          </div>
          <FitList items={notYet} muted />
        </div>
      </div>
    </Section>
  )
}

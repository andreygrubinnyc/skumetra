import { Section, Eyebrow, SectionTitle, Lead } from '@/components/ui/section'
import { detectClusters } from '@/data/content'

/**
 * Problem framing + what Skumetra detects, as three thematic groups
 * (Inventory Risk / Margin Risk / Data Quality) — not nine equal cards.
 */
export function DetectionSection() {
  return (
    <Section id="detects" ground="tint" aria-labelledby="detects-heading">
      <Eyebrow>The problem &amp; what Skumetra detects</Eyebrow>
      <SectionTitle id="detects-heading" className="mb-5 max-w-[26ch]">
        Your Amazon listing can look healthy while the supplier data behind it has already changed.
      </SectionTitle>
      <Lead className="mb-14 max-w-[66ch]">
        Listings live in Seller Central. Costs and quantities arrive in supplier files. Margin rules live in a
        spreadsheet. Nothing connects them — so a change on one side stays invisible on the other until an order
        goes out. Skumetra watches the gap across three kinds of risk.
      </Lead>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(28px,3.5vw,48px)]">
        {detectClusters.map((cluster) => (
          <div key={cluster.cluster}>
            <h3 className="mb-5 border-b border-line-strong pb-3 text-[13px] font-semibold uppercase tracking-[0.07em] text-ink">
              {cluster.cluster}
            </h3>
            <ul className="flex list-none flex-col gap-[22px] p-0">
              {cluster.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.label} className="flex gap-3.5">
                    <Icon size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <div>
                      <div className="mb-1 text-[15.5px] font-semibold">{item.label}</div>
                      <p className="m-0 text-[14.5px] leading-[1.6] text-ink-soft">{item.body}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}

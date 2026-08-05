import { CircleCheck, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { productMatches } from '@/data/landing-sample-data'

/** Amazon record and supplier record side by side, with the match verdict in the header. */
export function ProductMatching() {
  return (
    <div className="p-5">
      {productMatches.map((pair, i) => {
        const high = pair.confidence === 'high'
        const Icon = high ? CircleCheck : TriangleAlert
        return (
          <div
            key={pair.status}
            className={cn('overflow-hidden rounded-note border border-[#e6ebeb]', i > 0 && 'mt-4')}
          >
            <div
              className={cn(
                'flex items-center gap-2 border-b px-4 py-[11px]',
                high
                  ? 'border-[#dde8e8] bg-accent-tint2 text-accent-deep'
                  : 'border-warn-border bg-warn-bg text-warn-text',
              )}
            >
              <Icon size={16} aria-hidden />
              <span className="text-[13px] font-semibold">{pair.status}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              {(['amazon', 'supplier'] as const).map((side) => {
                const rec = pair[side]
                return (
                  <div
                    key={side}
                    className={cn('p-[18px]', side === 'amazon' && 'lg:border-r lg:border-[#eceeef]')}
                  >
                    <div className="mb-2.5 text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">
                      {side === 'amazon' ? 'Amazon listing' : 'Supplier product'}
                    </div>
                    <div className="mb-2.5 text-[15px] font-semibold">{rec.title}</div>
                    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[13px]">
                      {rec.fields.map((field) => (
                        <div key={field.label} className="col-span-2 grid grid-cols-subgrid">
                          <dt className="text-ink-faint">{field.label}</dt>
                          <dd
                            className={cn(
                              'm-0',
                              field.highlight && 'w-fit rounded-[3px] bg-accent-tint px-1',
                            )}
                          >
                            {field.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {side === 'supplier' && pair.note ? (
                      <p className="mb-0 mt-3.5 text-[13px] leading-[1.55] text-ink-soft">{pair.note}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

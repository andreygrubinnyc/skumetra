import { cn, formatUsd } from '@/lib/utils'
import { accountSummary, heroAlerts } from '@/data/landing-sample-data'
import { AppFrame } from './app-frame'
import { SeverityBadge, severityBorder } from './severity-badge'

const tiles = [
  { label: 'Monitored', value: String(accountSummary.productsMonitored) },
  { label: 'Critical', value: String(accountSummary.criticalAlerts), critical: true },
  { label: 'Below safe price', value: String(accountSummary.belowSafePrice) },
  { label: 'Stockouts', value: String(accountSummary.supplierStockouts) },
]

/** Hero preview: stat row + two alert cards. Deliberately compact — not the full Action Center. */
export function DashboardPreview() {
  return (
    <AppFrame
      title="Action Center"
      meta={accountSummary.supplierDataUpdatedLabel}
      elevation="hero"
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            className={cn(
              'border-b border-line-softer px-[18px] py-4',
              i < tiles.length - 1 && 'border-r',
            )}
          >
            <div className="mb-1.5 text-[11.5px] uppercase tracking-[0.05em] text-ink-faint">{t.label}</div>
            <div className={cn('font-mono text-[24px] font-medium', t.critical && 'text-sev-critical')}>
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-baseline gap-2 border-b border-line-softer bg-canvas-subtle px-[18px] py-3">
        <span className="text-[13px] text-ink-soft">Estimated margin at risk</span>
        <span className="ml-auto font-mono text-[14px] font-medium">
          {formatUsd(accountSummary.marginAtRisk)}
        </span>
      </div>

      <div className="p-[18px]">
        <div className="mb-3.5 text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">
          Needs your attention
        </div>
        <ul className="flex list-none flex-col gap-3 p-0">
          {heroAlerts.map((a) => {
            const critical = a.severity === 'critical'
            return (
              <li
                key={a.sku}
                className="rounded-control border border-[#eceeef] border-l-[3px] p-3.5"
                style={{ borderLeftColor: severityBorder(a.severity) }}
              >
                <div className="mb-2">
                  <SeverityBadge
                    severity={a.severity}
                    suffix={critical ? 'Supplier out of stock' : 'Price below safe threshold'}
                  />
                </div>
                <div className="mb-1 text-[14.5px] font-semibold">
                  {a.productName}{' '}
                  <span className="font-mono text-[13px] font-normal text-ink-faint">SKU {a.sku}</span>
                </div>
                {critical ? (
                  <>
                    {a.detail ? (
                      <p className="m-0 mb-2 text-[13.5px] leading-[1.5] text-ink-soft">{a.detail}</p>
                    ) : null}
                    <p className="m-0 text-[13.5px] leading-[1.5]">
                      <span className="text-ink-faint">Recommended action:</span> {a.recommendedAction}
                    </p>
                  </>
                ) : (
                  <div className="flex gap-7 font-mono text-[13px]">
                    <span className="text-ink-soft">
                      Amazon price{' '}
                      <span className="text-ink">
                        {a.amazonPrice !== undefined ? formatUsd(a.amazonPrice, { cents: true }) : '—'}
                      </span>
                    </span>
                    <span className="text-ink-soft">
                      Safe price{' '}
                      <span className="text-ink">
                        {a.minimumSafePrice !== undefined
                          ? formatUsd(a.minimumSafePrice, { cents: true })
                          : '—'}
                      </span>
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </AppFrame>
  )
}

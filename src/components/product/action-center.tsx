import { cn, formatUsd } from '@/lib/utils'
import { alertRows } from '@/data/landing-sample-data'
import { SeverityBadge, severityBorder } from './severity-badge'

const th =
  'border-b border-[#e6ebeb] px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-faint'
const td = 'border-b border-line-row px-4 py-3.5'

const money = (n?: number) => (n === undefined ? '—' : formatUsd(n, { cents: true }))

/** Eight-column table at ≥900px; the same rows become cards below it (no horizontal scroll). */
export function ActionCenter() {
  return (
    <div>
      <table className="hidden w-full border-collapse text-[13.5px] lg:table">
        <caption className="sr-only">
          Sample supplier alerts: severity, product, issue, prices, stock, safe price, and recommended action.
        </caption>
        <thead>
          <tr className="bg-canvas-subtle">
            <th scope="col" className={cn(th, 'text-left')}>Severity</th>
            <th scope="col" className={cn(th, 'text-left')}>Product</th>
            <th scope="col" className={cn(th, 'text-left')}>Issue</th>
            <th scope="col" className={cn(th, 'text-right')}>Amazon price</th>
            <th scope="col" className={cn(th, 'text-right')}>Supplier cost</th>
            <th scope="col" className={cn(th, 'text-right')}>Supplier stock</th>
            <th scope="col" className={cn(th, 'text-right')}>Safe price</th>
            <th scope="col" className={cn(th, 'text-left')}>Action</th>
          </tr>
        </thead>
        <tbody>
          {alertRows.map((r) => (
            <tr key={r.sku}>
              <td className={cn(td, 'whitespace-nowrap')}>
                <SeverityBadge severity={r.severity} />
              </td>
              <td className={td}>
                {r.productName}
                <br />
                <span className="font-mono text-[12px] text-ink-faint">{r.sku}</span>
              </td>
              <td className={cn(td, 'text-ink-muted')}>{r.alertType}</td>
              <td className={cn(td, 'text-right font-mono')}>{money(r.amazonPrice)}</td>
              <td className={cn(td, 'text-right font-mono')}>{money(r.supplierCost)}</td>
              <td
                className={cn(
                  td,
                  'text-right font-mono',
                  r.supplierQuantity === 0 && 'text-sev-critical',
                )}
              >
                {r.supplierQuantity ?? '—'}
              </td>
              <td className={cn(td, 'text-right font-mono')}>{money(r.minimumSafePrice)}</td>
              <td className={cn(td, 'text-ink-muted')}>{r.recommendedAction}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="grid list-none gap-3 p-4 lg:hidden">
        {alertRows.map((r) => (
          <li
            key={r.sku}
            className="rounded-control border border-[#eceeef] border-l-[3px] p-3.5"
            style={{ borderLeftColor: severityBorder(r.severity) }}
          >
            <div className="mb-1.5">
              <SeverityBadge severity={r.severity} />
            </div>
            <div className="mb-1.5 text-[14.5px] font-semibold">
              {r.productName}{' '}
              <span className="font-mono text-[12.5px] font-normal text-ink-faint">{r.sku}</span>
            </div>
            <p className="m-0 mb-1.5 text-[13.5px] text-ink-soft">
              {r.alertType} · Amazon {money(r.amazonPrice)} · Stock {r.supplierQuantity ?? '—'}
            </p>
            <p className="m-0 text-[13.5px]">
              <span className="text-ink-faint">Action:</span> {r.recommendedAction}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

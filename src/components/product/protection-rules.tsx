import { protectionRules } from '@/data/landing-sample-data'

/** The rules that produce every alert and safe price shown in the Action Center. */
export function ProtectionRules() {
  return (
    <div className="p-5">
      <p className="mb-5 max-w-[60ch] text-[14.5px] leading-[1.6] text-ink-soft">
        Every alert and safe price on the Action Center is derived from these values. Change a rule and the
        calculations follow it.
      </p>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] overflow-hidden rounded-note border border-[#e6ebeb]">
        {protectionRules.map((r) => (
          <div key={r.label} className="border-b border-r border-[#eceeef] px-[18px] py-4">
            <dt className="mb-1.5 text-[13px] text-ink-soft">{r.label}</dt>
            <dd className="m-0 font-mono text-[18px] font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

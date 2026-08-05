import Link from 'next/link'
import { SkumetraLogo } from '@/components/brand/skumetra-logo'
import { footerColumns } from '@/data/content'

export function SiteFooter() {
  return (
    <footer className="bg-ink-strong pb-10 pt-14">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="mb-10 grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <div className="mb-3.5">
              <SkumetraLogo theme="dark" size="md" href="/" />
            </div>
            <p className="m-0 max-w-[42ch] text-[14.5px] leading-[1.6] text-on-dark-mid">
              Supplier-aware stock, pricing, and margin protection for Amazon sellers.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-6">
            {footerColumns.map((col, i) => (
              <div key={i} className="flex flex-col gap-[11px]">
                {col.map((l) => (
                  <Link
                    key={l.href + l.label}
                    href={l.href}
                    className="text-[14px] text-on-dark-high no-underline transition-colors hover:text-white hover:no-underline"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-[#1e2729] pt-6">
          <span className="text-[13px] text-on-dark-faint">© 2026 Skumetra. All rights reserved.</span>
          <span className="font-mono text-[13px] text-on-dark-faint">skumetra.com</span>
        </div>
      </div>
    </footer>
  )
}

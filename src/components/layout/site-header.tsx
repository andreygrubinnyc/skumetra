import Link from 'next/link'
import { SkumetraLogo } from '@/components/brand/skumetra-logo'
import { ButtonLink } from '@/components/ui/button'
import { MobileNavigation } from './mobile-navigation'
import { navLinks } from '@/data/content'

/**
 * Sticky, lightweight header. There is deliberately no Sign In link — authentication
 * does not exist yet. Below 900px (lg) the links and desktop CTA collapse into the
 * MobileNavigation disclosure panel.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-white/[0.92] backdrop-blur-[10px]">
      <div className="relative mx-auto flex h-[68px] w-full max-w-[1200px] items-center gap-8 px-6">
        <SkumetraLogo href="/" size="sm" />

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-7 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14.5px] text-ink-muted no-underline transition-colors hover:text-ink hover:no-underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <ButtonLink href="/pilot" size="sm" className="hidden whitespace-nowrap lg:inline-flex">
          Join the Pilot
        </ButtonLink>

        <div className="ml-auto lg:hidden">
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}

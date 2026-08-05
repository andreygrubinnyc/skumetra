import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SkumetraMark, type MarkTheme } from './skumetra-mark'

export type LogoVariant = 'horizontal' | 'symbol'
export type LogoTheme = MarkTheme
export type LogoSize = 'sm' | 'md' | 'lg'

type Props = {
  /** `horizontal` = mark + wordmark; `symbol` = mark only (compact/mobile). */
  variant?: LogoVariant
  /** Palette for the surface it sits on. `light` on dark backgrounds → use `dark`. */
  theme?: LogoTheme
  size?: LogoSize
  /** Wrap the lockup in a link (omit inside another link or app chrome). */
  href?: string
  className?: string
}

const SIZES: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  sm: { mark: 16, text: 'text-[15px]', gap: 'gap-2' },
  md: { mark: 22, text: 'text-[18px]', gap: 'gap-[10px]' },
  lg: { mark: 24, text: 'text-[19px]', gap: 'gap-[10px]' },
}

const WORDMARK_COLOR: Record<LogoTheme, string> = {
  light: 'text-ink',
  dark: 'text-white',
  monochrome: 'text-current',
}

/**
 * Primary Skumetra lockup. Clear space: at least one grid cell (mark / 3) on every
 * side. Keep it understated — do not scale past 24px in navigation or footers.
 *
 * Always renders an accessible name: the wordmark reads "Skumetra"; the symbol-only
 * variant exposes it via `sr-only` text (or the link's `aria-label`).
 */
export function SkumetraLogo({
  variant = 'horizontal',
  theme = 'light',
  size = 'lg',
  href,
  className,
}: Props) {
  const s = SIZES[size]
  const symbolOnly = variant === 'symbol'

  const body = (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      <SkumetraMark
        size={s.mark}
        theme={theme}
        title={symbolOnly && !href ? 'Skumetra' : undefined}
      />
      {symbolOnly ? (
        <span className="sr-only">Skumetra</span>
      ) : (
        <span className={cn('font-sans font-semibold tracking-[-0.025em]', s.text, WORDMARK_COLOR[theme])}>
          Skumetra
        </span>
      )}
    </span>
  )

  if (!href) return body
  return (
    <Link href={href} aria-label="Skumetra home" className="no-underline hover:no-underline">
      {body}
    </Link>
  )
}

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'onDark'
type Size = 'sm' | 'md'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-press',
  secondary: 'bg-canvas text-ink border border-line-button hover:bg-[#f4f7f7]',
  onDark: 'bg-accent-light text-[#0a2222] font-semibold hover:bg-accent-lighter',
}

const SIZE: Record<Size, string> = {
  sm: 'text-[14.5px] px-4 py-[9px] rounded-chip',
  md: 'text-[16px] px-6 py-[15px] rounded-control',
}

const base =
  'inline-flex items-center justify-center gap-2.5 font-medium no-underline hover:no-underline transition-colors duration-150 disabled:cursor-progress disabled:opacity-95'

type Shared = { variant?: Variant; size?: Size; children: ReactNode }

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Shared & ComponentProps<'button'>) {
  return (
    <button className={cn(base, VARIANT[variant], SIZE[size], className)} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Shared & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, VARIANT[variant], SIZE[size], className)} {...rest}>
      {children}
    </Link>
  )
}

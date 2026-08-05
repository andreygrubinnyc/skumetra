import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** 1200px shell with the 24px gutter. Every section uses it. */
export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-6', className)}>{children}</div>
}

type SectionProps = {
  id?: string
  /** `tint` is the alternating #f7fafa ground with hairline rules. */
  ground?: 'canvas' | 'tint'
  'aria-labelledby'?: string
  children: ReactNode
  className?: string
}

export function Section({ id, ground = 'canvas', children, className, ...rest }: SectionProps) {
  const tint = ground === 'tint' ? 'bg-canvas-tint border-y border-[#eef2f2]' : ''
  return (
    <section id={id} className={cn('py-[clamp(64px,8vw,104px)]', tint, className)} {...rest}>
      <Shell>{children}</Shell>
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-[18px] text-[12.5px] font-semibold uppercase tracking-[0.1em] text-accent">
      {children}
    </p>
  )
}

export function SectionTitle({
  children,
  id,
  className,
}: {
  children: ReactNode
  id?: string
  className?: string
}) {
  return (
    <h2
      id={id}
      className={cn(
        'text-[clamp(27px,3.2vw,40px)] font-semibold leading-[1.14] tracking-[-0.024em]',
        className ?? 'max-w-[24ch]',
      )}
    >
      {children}
    </h2>
  )
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[17px] leading-[1.65] text-ink-soft', className ?? 'max-w-[64ch]')}>
      {children}
    </p>
  )
}

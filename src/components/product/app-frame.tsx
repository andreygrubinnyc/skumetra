import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SkumetraMark } from '@/components/brand/skumetra-mark'

/**
 * Shared chrome for every mock product surface, so the hero preview and the
 * tabbed previews read as one application. `elevation="hero"` is the slightly
 * stronger hero shadow.
 */
export function AppFrame({
  title,
  meta,
  elevation = 'default',
  children,
}: {
  title: string
  meta?: ReactNode
  elevation?: 'default' | 'hero'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-frame border border-line bg-canvas',
        elevation === 'hero' ? 'shadow-frame-hero' : 'shadow-frame',
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-line-softer bg-canvas-subtle px-[18px] py-3.5">
        <SkumetraMark size={15} />
        <span className="text-[13.5px] font-semibold tracking-[-0.01em]">{title}</span>
        {meta ? <span className="ml-auto font-mono text-[12px] text-ink-faint">{meta}</span> : null}
      </div>
      {children}
    </div>
  )
}

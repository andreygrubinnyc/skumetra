'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  panel: ReactNode
}

type Props = {
  items: TabItem[]
  label: string
  /** Optional render wrapper around the active panel (e.g. an app frame). */
  renderPanel?: (active: TabItem, panel: ReactNode) => ReactNode
  className?: string
  listClassName?: string
}

/**
 * WAI-ARIA tabs with automatic activation.
 * - Roving tabindex: only the selected tab is in the tab order.
 * - Keyboard: ArrowLeft/ArrowRight (wrapping), Home, End.
 */
export function Tabs({ items, label, renderPanel, className, listClassName }: Props) {
  const [active, setActive] = useState(items[0]?.id)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function activate(index: number) {
    const item = items[index]
    if (!item) return
    setActive(item.id)
    tabRefs.current[index]?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = items.length - 1
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      activate(index === last ? 0 : index + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      activate(index === 0 ? last : index - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      activate(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      activate(last)
    }
  }

  const activeItem = items.find((t) => t.id === active) ?? items[0]

  const panel = (
    <div
      role="tabpanel"
      id={`panel-${activeItem.id}`}
      aria-labelledby={`tab-${activeItem.id}`}
      tabIndex={0}
    >
      {activeItem.panel}
    </div>
  )

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className={cn('flex flex-wrap gap-2', listClassName)}>
        {items.map((t, i) => {
          const selected = t.id === active
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'rounded-control border px-4 py-2.5 text-[14.5px] font-medium transition-colors',
                selected
                  ? 'border-accent bg-accent text-white'
                  : 'border-line-input bg-canvas text-ink-body hover:bg-[#f4f7f7]',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {renderPanel ? renderPanel(activeItem, panel) : panel}
    </div>
  )
}

'use client'

import { useRef, useState, type ReactNode } from 'react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccordionItem {
  id: string
  header: ReactNode
  content: ReactNode
}

type Props = {
  items: AccordionItem[]
  /** Allow more than one panel open at a time. Default: single-open. */
  allowMultiple?: boolean
  className?: string
}

/**
 * WAI-ARIA accordion.
 * - Each header is a real <button> with aria-expanded / aria-controls.
 * - Panels are role="region" labelled by their header.
 * - Keyboard: ArrowUp/ArrowDown move between headers, Home/End jump to first/last.
 */
export function Accordion({ items, allowMultiple = false, className }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([])

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = items.length - 1
    let target: number | null = null
    if (e.key === 'ArrowDown') target = index === last ? 0 : index + 1
    else if (e.key === 'ArrowUp') target = index === 0 ? last : index - 1
    else if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = last
    if (target !== null) {
      e.preventDefault()
      btnRefs.current[target]?.focus()
    }
  }

  return (
    <div className={cn('border-t border-line-soft', className)}>
      {items.map((item, i) => {
        const isOpen = open.has(item.id)
        return (
          <div key={item.id} className="border-b border-line-soft">
            <h3 className="m-0">
              <button
                ref={(el) => {
                  btnRefs.current[i] = el
                }}
                type="button"
                id={`accordion-header-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${item.id}`}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="flex w-full items-center gap-4 py-5 text-left text-[16.5px] font-medium text-ink"
              >
                <span className="flex-1">{item.header}</span>
                {isOpen ? (
                  <Minus size={16} className="shrink-0 text-accent" aria-hidden />
                ) : (
                  <Plus size={16} className="shrink-0 text-accent" aria-hidden />
                )}
              </button>
            </h3>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isOpen}
            >
              <div className="mb-[22px] max-w-[70ch] text-[15px] leading-[1.65] text-ink-soft">
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

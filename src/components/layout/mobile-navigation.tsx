'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { navLinks } from '@/data/content'

/**
 * Compact disclosure menu shown below 900px (lg). Accessible: the toggle exposes
 * aria-expanded / aria-controls, Escape closes the panel and returns focus to the
 * toggle, and every link closes the menu on activation.
 */
export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-line-input bg-canvas text-ink hover:bg-[#f4f7f7]"
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-t border-line-soft bg-canvas px-6 pb-5 pt-3.5 shadow-frame"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-1 py-3 text-[16px] text-ink no-underline hover:no-underline"
              >
                {l.label}
              </Link>
            ))}
            <ButtonLink href="/pilot" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Join the Founding Seller Pilot
            </ButtonLink>
          </nav>
        </div>
      )}
    </div>
  )
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names, resolving conflicts (later wins).
 * The shadcn/ui convention — used by every UI primitive in `components/ui`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as USD, e.g. 284 -> "$284", 31.45 -> "$31.45". */
export function formatUsd(value: number, opts: { cents?: boolean } = {}): string {
  const hasCents = opts.cents ?? !Number.isInteger(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value)
}

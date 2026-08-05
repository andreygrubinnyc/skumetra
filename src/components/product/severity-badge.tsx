import { OctagonAlert, TrendingDown, TrendingUp, CircleCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEVERITY_META } from '@/data/landing-sample-data'
import type { AlertSeverity } from '@/types/landing'

/**
 * Severity is NEVER communicated by color alone: every level pairs an icon with a
 * text label. Keep both together wherever severity appears.
 */
const ICON: Record<AlertSeverity, LucideIcon> = {
  critical: OctagonAlert,
  high: TrendingDown,
  medium: TrendingUp,
  healthy: CircleCheck,
}

export function severityBorder(severity: AlertSeverity) {
  return SEVERITY_META[severity].borderColor
}

export function SeverityBadge({
  severity,
  suffix,
  className,
}: {
  severity: AlertSeverity
  suffix?: string
  className?: string
}) {
  const { label, colorClass } = SEVERITY_META[severity]
  const Icon = ICON[severity]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-[12px] font-semibold', colorClass, className)}
    >
      <Icon size={14} aria-hidden />
      {suffix ? `${label} — ${suffix}` : label}
    </span>
  )
}

/**
 * Shared types for the landing-page sample data and content.
 * All figures rendered from these types are fictional demo data — never real
 * customer results. See `src/data/landing-sample-data.ts`.
 */

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'healthy'

/** Human-readable label + status color token key for a severity level. */
export interface SeverityMeta {
  label: string
  /** Tailwind text color utility, e.g. "text-sev-critical". */
  colorClass: string
  /** Raw hex used for the left accent border on cards. */
  borderColor: string
}

export interface SampleAlert {
  sku: string
  productName: string
  alertType: string
  severity: AlertSeverity
  amazonPrice?: number
  supplierCost?: number
  supplierQuantity?: number
  minimumSafePrice?: number
  recommendedAction: string
  /** Longer sentence used by the compact hero preview. */
  detail?: string
}

export interface AccountSummary {
  productsMonitored: number
  criticalAlerts: number
  belowSafePrice: number
  supplierStockouts: number
  marginAtRisk: number
  supplierDataUpdatedLabel: string
}

export interface ProtectionRule {
  label: string
  value: string
}

export interface MatchField {
  label: string
  value: string
  /** Highlight the value as a matching identifier. */
  highlight?: boolean
}

export interface MatchRecord {
  title: string
  fields: MatchField[]
}

export interface ProductMatch {
  confidence: 'high' | 'review'
  status: string
  amazon: MatchRecord
  supplier: MatchRecord
  note?: string
}

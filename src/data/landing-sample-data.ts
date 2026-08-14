/**
 * Fictional sample data for the product previews.
 *
 * The hero preview, the Action Center table and the Protection Rules panel all
 * describe the SAME imaginary account. Every safe price below is COMPUTED from
 * `SAMPLE_RULES` using the approved calc-v1 formula in
 * `src/lib/calc/safe-price.ts` — not hand-authored — and
 * `landing-sample-data.test.ts` fails if any value drifts out of agreement.
 *
 * `SAMPLE_RULES` are fictional demonstration assumptions chosen to make the
 * examples readable. They are NOT Amazon's real fee schedule, and they are not
 * approved production defaults for any seller.
 *
 * These are demonstration figures only — never present them as real customer
 * data or results. Product names are generic on purpose: no real brands, no
 * real sellers.
 */
import type {
  AccountSummary,
  ProductMatch,
  ProtectionRule,
  SampleAlert,
  SeverityMeta,
  AlertSeverity,
} from '@/types/landing'
import type { SafePriceRules } from '@/lib/calc/safe-price'

export const SEVERITY_META: Record<AlertSeverity, SeverityMeta> = {
  critical: { label: 'Critical', colorClass: 'text-sev-critical', borderColor: '#a4262c' },
  high: { label: 'High', colorClass: 'text-sev-high', borderColor: '#9a5b00' },
  medium: { label: 'Medium', colorClass: 'text-sev-medium', borderColor: '#c8a15a' },
  healthy: { label: 'Healthy', colorClass: 'text-sev-healthy', borderColor: '#0b6e6e' },
}

export const accountSummary: AccountSummary = {
  productsMonitored: 184,
  criticalAlerts: 4,
  belowSafePrice: 7,
  supplierStockouts: 5,
  marginAtRisk: 284,
  supplierDataUpdatedLabel: 'Supplier data updated 6 hours ago',
}

/**
 * The single synthetic assumption set behind every sample figure.
 *
 * Fictional demonstration values — not Amazon's real fees, and not approved
 * production defaults. Fixed marketplace fee, additional fixed buffer and
 * additional percentage cost are all zero in this example, so they are omitted
 * from the displayed panel; omitting them cannot mislead, because the values
 * shown fully determine every number in the preview.
 */
export const SAMPLE_RULES: SafePriceRules = {
  supplierCost: 0, // set per product below
  supplierShipping: 4.0,
  marketplacePercentageFee: 0.15,
  fulfillmentCost: 3.0,
  minimumDollarProfit: 5.0,
  minimumMarginPercentage: 0.15,
}

/** Builds the rule set for one product by slotting in its supplier cost. */
export function sampleRulesFor(supplierCost: number): SafePriceRules {
  return { ...SAMPLE_RULES, supplierCost }
}

/** Low supplier quantity at or below which a stock alert is raised. */
export const SAMPLE_LOW_STOCK_THRESHOLD = 5
/** Supplier data older than this is treated as stale. */
export const SAMPLE_STALE_AFTER_DAYS = 3
/** Caps how far a single price recommendation may move. */
export const SAMPLE_MAX_PRICE_CHANGE = 0.2

export const protectionRules: ProtectionRule[] = [
  { label: 'Minimum profit', value: '$5.00' },
  { label: 'Minimum margin', value: '15%' },
  { label: 'Supplier shipping', value: '$4.00' },
  { label: 'Est. marketplace fee', value: '15%' },
  { label: 'Fulfillment cost', value: '$3.00' },
  { label: 'Low-stock threshold', value: '5 units' },
  { label: 'Supplier data stale after', value: '3 days' },
  { label: 'Max recommended price change', value: '20%' },
]

/**
 * Every `minimumSafePrice` below is the calc-v1 result for that product's
 * supplier cost under `SAMPLE_RULES`. Do not edit these by hand — change the
 * supplier cost or the rules and let the test recompute the expectation.
 */
export const alertRows: SampleAlert[] = [
  {
    // Priced healthily ($33.58 safe vs $34.99 listed) — availability, not
    // margin, is the problem. No safe price is shown because there is nothing
    // to sell: the actionable step is zeroing the Amazon quantity.
    severity: 'critical',
    productName: 'Wireless Keyboard',
    sku: 'KB-204',
    alertType: 'Supplier out of stock',
    amazonPrice: 34.99,
    supplierCost: 16.5,
    supplierQuantity: 0,
    minimumSafePrice: undefined,
    recommendedAction: 'Set Amazon quantity to 0',
    detail: 'Supplier quantity is 0 while Amazon quantity is 8.',
  },
  {
    // Profit rule controls: $31.48 vs a $31.08 margin floor. The $3.49 gap is
    // reachable inside the 20% max-change rule.
    severity: 'high',
    productName: 'Stainless Steel Water Bottle',
    sku: 'WB-118',
    alertType: 'Price below safe threshold',
    amazonPrice: 27.99,
    supplierCost: 14.75,
    supplierQuantity: 62,
    minimumSafePrice: 31.48,
    recommendedAction: 'Raise price to $31.48 or pause',
    detail: 'Current price $27.99 is below the calculated safe price of $31.48.',
  },
  {
    // The cost rise moved the safe price $32.95 → $39.29, compressing margin
    // from 27.43% to 16.16%. Still above both floors, so this is a review
    // prompt rather than an unsafe-price alert.
    severity: 'medium',
    productName: 'USB-C Charging Hub',
    sku: 'CH-310',
    alertType: 'Supplier cost increased $16.00 → $20.50',
    amazonPrice: 39.95,
    supplierCost: 20.5,
    supplierQuantity: 43,
    minimumSafePrice: 39.29,
    recommendedAction: 'Review margin at new cost',
  },
  {
    // Financials are comfortable (27.22% margin). The alert is about data
    // age: 9 days against a 3-day staleness rule.
    severity: 'medium',
    productName: 'Desk Lamp',
    sku: 'DL-402',
    alertType: 'Supplier data stale (9 days)',
    amazonPrice: 45.0,
    supplierCost: 19.0,
    supplierQuantity: 18,
    minimumSafePrice: 37.15,
    recommendedAction: 'Upload a current supplier file',
  },
]

/** The hero shows only the first two rows so the preview stays readable. */
export const heroAlerts = alertRows.slice(0, 2)

export const productMatches: ProductMatch[] = [
  {
    confidence: 'high',
    status: 'High confidence — matching identifier and product details',
    amazon: {
      title: '7-in-1 USB-C Charging Hub',
      fields: [
        { label: 'SKU', value: 'CH-310' },
        { label: 'ASIN', value: 'B0SKM10003' },
        { label: 'Category', value: 'Electronics' },
      ],
    },
    supplier: {
      title: 'USB-C Charging Hub 7 Port',
      fields: [
        // Must match the CH-310 row in `alertRows` — same imaginary product.
        { label: 'Supplier SKU', value: 'BL-1002' },
        { label: 'Cost', value: '$20.50' },
        { label: 'Quantity', value: '43' },
      ],
    },
  },
  {
    confidence: 'review',
    status: 'Needs review — package quantity differs',
    amazon: {
      title: 'Microfiber Cleaning Cloth, 6-Pack',
      fields: [
        { label: 'SKU', value: 'MC-660' },
        { label: 'Pack size', value: '6 units' },
        { label: 'UPC', value: 'Not provided' },
      ],
    },
    supplier: {
      title: 'Microfiber Cloth 12pk Case',
      fields: [
        { label: 'Supplier SKU', value: 'MF-CLOTH-12' },
        { label: 'Pack size', value: '12 units' },
        { label: 'Cost', value: '$9.60 / case' },
      ],
    },
    note: 'Confirm the unit conversion before this match is used in profit calculations.',
  },
]

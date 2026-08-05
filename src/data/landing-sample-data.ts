/**
 * Fictional, internally consistent sample data for the product previews.
 *
 * The hero preview, the Action Center table and the Protection Rules panel all
 * describe the SAME imaginary account, so the numbers must stay consistent with
 * each other (safe prices follow the rules below). These are demonstration
 * figures only — never present them as real customer data or results.
 *
 * Product names are generic on purpose: no real brands, no real sellers.
 */
import type {
  AccountSummary,
  ProductMatch,
  ProtectionRule,
  SampleAlert,
  SeverityMeta,
  AlertSeverity,
} from '@/types/landing'

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

export const protectionRules: ProtectionRule[] = [
  { label: 'Minimum profit', value: '$5.00' },
  { label: 'Minimum margin', value: '15%' },
  { label: 'Low-stock threshold', value: '5 units' },
  { label: 'Supplier data stale after', value: '3 days' },
  { label: 'Default shipping cost', value: '$4.00' },
  { label: 'Max recommended price change', value: '20%' },
]

export const alertRows: SampleAlert[] = [
  {
    severity: 'critical',
    productName: 'Wireless Keyboard',
    sku: 'KB-204',
    alertType: 'Supplier out of stock',
    amazonPrice: 34.99,
    supplierCost: 21.4,
    supplierQuantity: 0,
    minimumSafePrice: undefined,
    recommendedAction: 'Set Amazon quantity to 0',
    detail: 'Supplier quantity is 0 while Amazon quantity is 8.',
  },
  {
    severity: 'high',
    productName: 'Stainless Steel Water Bottle',
    sku: 'WB-118',
    alertType: 'Price below safe threshold',
    amazonPrice: 27.99,
    supplierCost: 14.75,
    supplierQuantity: 62,
    minimumSafePrice: 31.45,
    recommendedAction: 'Raise price to $31.45 or pause',
    detail: 'Current price $27.99 is below the calculated safe price of $31.45.',
  },
  {
    severity: 'medium',
    productName: 'USB-C Charging Hub',
    sku: 'CH-310',
    alertType: 'Supplier cost increased $18.50 → $22.00',
    amazonPrice: 39.95,
    supplierCost: 22.0,
    supplierQuantity: 43,
    minimumSafePrice: 38.2,
    recommendedAction: 'Review margin at new cost',
  },
  {
    severity: 'medium',
    productName: 'Desk Lamp',
    sku: 'DL-402',
    alertType: 'Supplier data stale (9 days)',
    amazonPrice: 45.0,
    supplierCost: 26.1,
    supplierQuantity: 18,
    minimumSafePrice: 41.8,
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
        { label: 'Supplier SKU', value: 'BL-1002' },
        { label: 'Cost', value: '$19.64' },
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

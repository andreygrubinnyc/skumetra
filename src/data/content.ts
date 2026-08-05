/**
 * Approved marketing copy for the landing page. Use verbatim.
 *
 * Positioning is LOCKED: Skumetra detects supplier stock and cost changes before
 * they cause unprofitable or unavailable sales. Do NOT reposition it as a generic
 * repricer, marketplace, product-research tool, autonomous seller, or dropshipping
 * platform. See README "Copy rules".
 */
import type { LucideIcon } from 'lucide-react'
import {
  Package,
  TrendingUp,
  History,
  GitCompareArrows,
  TriangleAlert,
  Unlink,
  Tag,
  Percent,
  CircleHelp,
  Key,
  UserRoundMinus,
  FolderLock,
  Hand,
  Calculator,
  Archive,
} from 'lucide-react'

export const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'What It Detects', href: '#detects' },
  { label: 'Pilot', href: '#pilot' },
  { label: 'FAQ', href: '#faq' },
] as const

export const footerColumns: Array<
  Array<{ label: string; href: string; placeholder?: boolean }>
> = [
  [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pilot', href: '#pilot' },
    { label: 'Pricing', href: '#pilot' },
    { label: 'FAQ', href: '#faq' },
  ],
  [
    { label: 'Contact', href: 'mailto:hello@skumetra.com' },
    // Both routes render a holding page. Real legal copy is required before launch.
    { label: 'Privacy', href: '/privacy', placeholder: true },
    { label: 'Terms', href: '/terms', placeholder: true },
  ],
]

export interface ProblemCard {
  icon: LucideIcon
  title: string
  body: string
}

export const problemCards: ProblemCard[] = [
  {
    icon: Package,
    title: 'Supplier stock changed',
    body: 'A product may remain active on Amazon after the supplier reaches zero inventory.',
  },
  {
    icon: TrendingUp,
    title: 'Supplier cost increased',
    body: 'The listing price may no longer meet your minimum profit or margin.',
  },
  {
    icon: History,
    title: 'Data became stale',
    body: "You may be making today's decisions from last month's supplier file.",
  },
  {
    icon: GitCompareArrows,
    title: 'Products do not match cleanly',
    body: 'Supplier and Amazon product identifiers may be incomplete or inconsistent.',
  },
]

export interface DetectItem {
  icon: LucideIcon
  label: string
  body: string
}

export interface DetectCluster {
  cluster: string
  items: DetectItem[]
}

export const detectClusters: DetectCluster[] = [
  {
    cluster: 'Inventory risk',
    items: [
      {
        icon: Package,
        label: 'Supplier stockouts',
        body: 'Find listings that remain available after the supplier quantity reaches zero.',
      },
      {
        icon: TriangleAlert,
        label: 'Low supplier inventory',
        body: 'Identify products approaching your configured stock threshold.',
      },
      {
        icon: History,
        label: 'Stale supplier data',
        body: 'See when the latest supplier file is older than your accepted threshold.',
      },
    ],
  },
  {
    cluster: 'Margin risk',
    items: [
      {
        icon: TrendingUp,
        label: 'Supplier cost increases',
        body: 'See which cost changes could reduce profit or make a listing unprofitable.',
      },
      {
        icon: Tag,
        label: 'Unsafe selling prices',
        body: 'Compare the current Amazon price with the calculated minimum safe price.',
      },
      {
        icon: Percent,
        label: 'Margin below target',
        body: 'Identify products that no longer meet your dollar-profit or percentage-margin rules.',
      },
    ],
  },
  {
    cluster: 'Data quality',
    items: [
      {
        icon: Unlink,
        label: 'Unmatched products',
        body: 'Find Amazon listings with no connected supplier product.',
      },
      {
        icon: GitCompareArrows,
        label: 'Low-confidence matches',
        body: 'Review possible product relationships before relying on their calculations.',
      },
      {
        icon: CircleHelp,
        label: 'Missing supplier data',
        body: 'Identify missing supplier cost, stock, identifiers, or other required values.',
      },
    ],
  },
]

export interface HowItWorksStep {
  title: string
  body: string
  note?: string
  files?: string[]
}

export const steps: HowItWorksStep[] = [
  {
    title: 'Upload your files',
    body: 'Upload your Amazon Active Listings file and a supplier inventory or pricing file (CSV or Excel).',
    files: ['amazon-active-listings.csv', 'supplier-inventory.xlsx'],
  },
  {
    title: 'Match products',
    body: 'Skumetra connects supplier products to Amazon listings using SKU, ASIN, UPC, manufacturer part number, and product-title similarity.',
    note: 'Uncertain matches stay available for your review rather than being applied silently.',
  },
  {
    title: 'Apply protection rules',
    body: 'Define your minimum profit, minimum margin, stock threshold, shipping assumptions, and data-freshness rules.',
  },
  {
    title: 'Review what needs attention',
    body: 'Skumetra identifies stockouts, supplier cost changes, unsafe prices, stale data, and uncertain matches, then explains the recommended next action.',
  },
]

export const aiAssisted = [
  'Column mapping',
  'Product matching',
  'Conflicting product-title comparison',
  'Alert explanations',
  'Prioritization assistance',
]

export const ruleBased = [
  'Supplier cost',
  'Marketplace fees',
  'Shipping assumptions',
  'Minimum profit',
  'Minimum margin',
  'Safe price',
  'Stock threshold',
]

export const aiBoundaries = [
  'Financial calculations are deterministic.',
  'AI does not approve uncertain matches.',
  'AI does not automatically update Amazon.',
  'The seller makes the final decision.',
]

export const goodFit = [
  'Active Amazon US seller',
  'Professional seller account',
  'Approximately 50–500 listings',
  'One or more suppliers',
  'Supplier CSV or Excel data',
  'Real stock, cost, or margin problems',
]

export const notYet = [
  'No active Amazon listings',
  'No supplier relationship',
  'Looking for a product-research course',
  'Seeking automated purchasing',
  'Seeking full Amazon account management',
  'Requiring a full enterprise ERP',
]

export const pilotIncluded = [
  'One Amazon listing file',
  'One supplier file',
  'Up to 100 matched SKUs',
  'Stock and cost analysis',
  'Safe-price calculations',
  'Margin alerts',
  'AI-assisted product matching',
  'Prioritized recommendations',
  'Limited onboarding assistance',
  'Weekly summary',
]

export const pilotExcluded = [
  'Automatic Amazon updates',
  'Automated purchasing',
  'Supplier discovery',
  'Customer-order processing',
  'Custom supplier integrations',
  'Multiple marketplaces',
]

export interface TrustPoint {
  icon: LucideIcon
  body: string
}

export const trustPoints: TrustPoint[] = [
  { icon: Key, body: 'Skumetra does not request Amazon passwords.' },
  { icon: UserRoundMinus, body: 'The MVP does not process Amazon customer information.' },
  { icon: FolderLock, body: 'Uploaded files remain private to your account.' },
  { icon: Hand, body: 'You approve every recommendation. Nothing is applied for you.' },
  { icon: Calculator, body: 'Financial recommendations show the data and rules used to produce them.' },
  { icon: Archive, body: 'Original import values are preserved so you can review what changed.' },
]

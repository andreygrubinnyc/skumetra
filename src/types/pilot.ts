/** Types for the Founding Seller Pilot application form and its submission. */

export type SellingStatus = 'yes' | 'soon' | 'no'
export type ListingRange = 'lt50' | '50-100' | '101-500' | '501-1000' | 'gt1000'
export type SupplierCount = '0' | '1' | '2-3' | '4-10' | '10+'
export type SupplierFileFormat = 'csv' | 'xlsx' | 'both' | 'pdf' | 'portal'
export type PrimaryProblem =
  | 'stockouts'
  | 'cost'
  | 'pricing'
  | 'margin'
  | 'sync'
  | 'matching'
  | 'other'
export type FileWillingness = 'real' | 'anon' | 'unsure'

/**
 * The validated shape produced by `pilotApplicationSchema`.
 * Keep this in sync with the Zod schema (the schema is the source of truth).
 */
export interface PilotApplication {
  name: string
  email: string
  business: string
  selling: SellingStatus
  listings: ListingRange
  suppliers: SupplierCount
  format: SupplierFileFormat
  problem: PrimaryProblem
  files: FileWillingness
  comments?: string
  /** Honeypot — must be empty for a legitimate submission. See the schema for detail. */
  honeypot?: string
}

/** Result returned by the submission adapter (see `lib/services/pilot-submission.ts`). */
export type PilotSubmissionResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

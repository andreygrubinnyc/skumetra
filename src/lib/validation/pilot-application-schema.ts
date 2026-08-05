import { z } from 'zod'

/**
 * Source of truth for the pilot application shape and its select options.
 * When a backend is added, mirror EVERY rule here on the server too.
 */

export const LISTING_RANGES = [
  { value: 'lt50', label: 'Fewer than 50' },
  { value: '50-100', label: '50–100' },
  { value: '101-500', label: '101–500' },
  { value: '501-1000', label: '501–1,000' },
  { value: 'gt1000', label: 'More than 1,000' },
] as const

export const SUPPLIER_COUNTS = [
  { value: '0', label: 'None yet' },
  { value: '1', label: '1' },
  { value: '2-3', label: '2–3' },
  { value: '4-10', label: '4–10' },
  { value: '10+', label: 'More than 10' },
] as const

export const FILE_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (.xlsx / .xls)' },
  { value: 'both', label: 'Both CSV and Excel' },
  { value: 'pdf', label: 'PDF or email only' },
  { value: 'portal', label: 'Supplier portal / no file' },
] as const

export const PROBLEMS = [
  { value: 'stockouts', label: 'Supplier stockouts' },
  { value: 'cost', label: 'Supplier cost changes' },
  { value: 'pricing', label: 'Unsafe pricing' },
  { value: 'margin', label: 'Margin visibility' },
  { value: 'sync', label: 'Inventory synchronization' },
  { value: 'matching', label: 'Product matching' },
  { value: 'other', label: 'Other' },
] as const

export const SELLING_OPTIONS = [
  { value: 'yes', label: 'Yes, with live listings' },
  { value: 'soon', label: 'Registered, not yet listing' },
  { value: 'no', label: 'No' },
] as const

export const FILE_WILLINGNESS_OPTIONS = [
  { value: 'real', label: 'Yes, real files' },
  { value: 'anon', label: 'Yes, anonymized only' },
  { value: 'unsure', label: 'Not sure yet' },
] as const

const values = <T extends readonly { value: string }[]>(opts: T) =>
  opts.map((o) => o.value) as [string, ...string[]]

export const pilotApplicationSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(200, 'Please shorten your name.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(254, 'Please shorten your email address.'),
  business: z
    .string()
    .trim()
    .min(2, 'Please enter your business or store name.')
    .max(200, 'Please shorten your business or store name.'),
  selling: z.enum(values(SELLING_OPTIONS), { errorMap: () => ({ message: 'Please select one option.' }) }),
  listings: z.enum(values(LISTING_RANGES), { errorMap: () => ({ message: 'Please select a range.' }) }),
  suppliers: z.enum(values(SUPPLIER_COUNTS), {
    errorMap: () => ({ message: 'Please select an option.' }),
  }),
  format: z.enum(values(FILE_FORMATS), { errorMap: () => ({ message: 'Please select a format.' }) }),
  problem: z.enum(values(PROBLEMS), {
    errorMap: () => ({ message: 'Please select your primary problem.' }),
  }),
  files: z.enum(values(FILE_WILLINGNESS_OPTIONS), {
    errorMap: () => ({ message: 'Please select one option.' }),
  }),
  comments: z.string().trim().max(2000, 'Please keep comments under 2000 characters.').optional(),
  /**
   * Honeypot — a real form field never presents this to sighted or assistive-
   * technology users (see the hidden input in PilotApplicationForm). Bots
   * that blindly fill every input in the DOM tend to fill this one too.
   * Never validated as an error here; the server rejects silently when
   * non-empty. Bounded only to cap payload size.
   */
  honeypot: z.string().max(200).optional(),
})

export type PilotApplicationInput = z.input<typeof pilotApplicationSchema>
export type PilotApplicationValues = z.output<typeof pilotApplicationSchema>

/** Ordered field list — used to move focus to the first error and to build the error summary. */
export const PILOT_FIELD_ORDER = [
  'name',
  'email',
  'business',
  'selling',
  'listings',
  'suppliers',
  'format',
  'problem',
  'files',
] as const

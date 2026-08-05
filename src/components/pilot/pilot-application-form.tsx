'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { submitPilotApplication } from '@/lib/services/pilot-submission'
import type { PilotApplication } from '@/types/pilot'
import {
  pilotApplicationSchema,
  type PilotApplicationInput,
  PILOT_FIELD_ORDER,
  LISTING_RANGES,
  SUPPLIER_COUNTS,
  FILE_FORMATS,
  PROBLEMS,
  SELLING_OPTIONS,
  FILE_WILLINGNESS_OPTIONS,
} from '@/lib/validation/pilot-application-schema'
import { PilotSuccessState } from './pilot-success-state'

const FIELD_LABELS: Record<(typeof PILOT_FIELD_ORDER)[number], string> = {
  name: 'Full name',
  email: 'Email',
  business: 'Business or store name',
  selling: 'Are you currently selling on Amazon US?',
  listings: 'Approximate active listings',
  suppliers: 'Number of suppliers',
  format: 'Supplier-file format',
  problem: 'Primary problem',
  files: 'Willingness to provide files',
}

const labelCls = 'mb-[7px] block text-[14px] font-medium'
const controlCls = 'w-full rounded-control border bg-canvas px-[13px] py-[11px] text-[15px]'
const radioPill =
  'inline-flex cursor-pointer items-center gap-2 rounded-control border border-line-input bg-canvas px-3.5 py-2.5 text-[14.5px]'
const legendCls = 'mb-[18px] p-0 text-[12.5px] font-semibold uppercase tracking-[0.07em] text-ink-faint'
const req = <span aria-hidden className="text-sev-critical">*</span>

function borderCls(invalid?: boolean) {
  return invalid ? 'border-danger-input' : 'border-line-input'
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-[7px] text-[13px] text-sev-critical">
      {message}
    </p>
  )
}

type Status = 'idle' | 'submitting' | 'success'

/**
 * Founding Seller Pilot application.
 *
 * States: idle → (invalid → summary + field errors) → submitting → success,
 * plus a submit-failure banner. Validation runs on submit (RHF + Zod). On a failed
 * submission, focus moves to the error summary; each summary item focuses its field.
 */
export function PilotApplicationForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState('')
  const [errorAttempt, setErrorAttempt] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)

  // Ref access belongs in an effect, not in the handleSubmit callbacks below —
  // this fires after every failed attempt (validation or submission), even if
  // the same fields are still invalid and formState.errors doesn't change.
  useEffect(() => {
    if (errorAttempt > 0) summaryRef.current?.focus()
  }, [errorAttempt])

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PilotApplicationInput>({
    resolver: zodResolver(pilotApplicationSchema),
    mode: 'onSubmit',
  })

  if (status === 'success') return <PilotSuccessState />

  const submitting = status === 'submitting' || isSubmitting
  const errorFields = PILOT_FIELD_ORDER.filter((f) => errors[f])
  const showSummary = errorFields.length > 0

  async function onValid(values: PilotApplicationInput) {
    setSubmitError('')
    setStatus('submitting')
    try {
      const result = await submitPilotApplication(values as PilotApplication)
      if (result.ok) {
        setStatus('success')
      } else {
        setStatus('idle')
        setSubmitError(result.error)
        setErrorAttempt((n) => n + 1)
      }
    } catch {
      setStatus('idle')
      setSubmitError('Something went wrong sending your application. Please try again.')
      setErrorAttempt((n) => n + 1)
    }
  }

  function onInvalid() {
    setErrorAttempt((n) => n + 1)
  }

  return (
    <form
      onSubmit={handleSubmit(onValid, onInvalid)}
      noValidate
      className="rounded-frame border border-line bg-canvas p-[clamp(20px,3vw,32px)]"
    >
      {(showSummary || submitError) && (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className="mb-6 rounded-[9px] border border-danger-border bg-danger-bg px-4 py-3.5 outline-none"
        >
          <div className="flex gap-2.5">
            <TriangleAlert size={18} className="mt-px shrink-0 text-sev-critical" aria-hidden />
            <div>
              <p className="m-0 text-[14.5px] font-medium leading-[1.5] text-danger-text">
                {submitError
                  ? submitError
                  : errorFields.length === 1
                    ? 'One field still needs your attention.'
                    : `${errorFields.length} fields still need your attention.`}
              </p>
              {showSummary && (
                <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                  {errorFields.map((f) => (
                    <li key={f}>
                      <button
                        type="button"
                        onClick={() => setFocus(f)}
                        className="text-[13.5px] text-danger-text underline underline-offset-2"
                      >
                        {FIELD_LABELS[f]}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── About you ────────────────────────────────────────────── */}
      <fieldset className="m-0 mb-7 border-0 p-0">
        <legend className={legendCls}>About you</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
          <div>
            <label htmlFor="name" className={labelCls}>
              Full name {req}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jordan Reyes"
              aria-invalid={!!errors.name || undefined}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={cn(controlCls, borderCls(!!errors.name))}
              {...register('name')}
            />
            <FieldError id="name-error" message={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Email {req}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@yourstore.com"
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={cn(controlCls, borderCls(!!errors.email))}
              {...register('email')}
            />
            <FieldError id="email-error" message={errors.email?.message} />
          </div>
          <div>
            <label htmlFor="business" className={labelCls}>
              Business or store name {req}
            </label>
            <input
              id="business"
              type="text"
              autoComplete="organization"
              placeholder="Northline Supply Co."
              aria-invalid={!!errors.business || undefined}
              aria-describedby={errors.business ? 'business-error' : undefined}
              className={cn(controlCls, borderCls(!!errors.business))}
              {...register('business')}
            />
            <FieldError id="business-error" message={errors.business?.message} />
          </div>
        </div>
      </fieldset>

      {/* ── Your Amazon business ─────────────────────────────────── */}
      <fieldset className="m-0 mb-7 border-0 p-0">
        <legend className={legendCls}>Your Amazon business</legend>

        <fieldset className="m-0 mb-[18px] border-0 p-0">
          <legend className="mb-2.5 block p-0 text-[14px] font-medium">
            Are you currently selling on Amazon US? {req}
          </legend>
          <div
            className="flex flex-wrap gap-2.5"
            aria-describedby={errors.selling ? 'selling-error' : undefined}
          >
            {SELLING_OPTIONS.map((o) => (
              <label key={o.value} className={radioPill}>
                <input
                  type="radio"
                  value={o.value}
                  className="m-0 accent-accent"
                  aria-invalid={!!errors.selling || undefined}
                  {...register('selling')}
                />
                {o.label}
              </label>
            ))}
          </div>
          <FieldError id="selling-error" message={errors.selling?.message} />
        </fieldset>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
          {(
            [
              { name: 'listings', label: 'Approximate active listings', placeholder: 'Select a range', options: LISTING_RANGES },
              { name: 'suppliers', label: 'Number of suppliers', placeholder: 'Select', options: SUPPLIER_COUNTS },
              { name: 'format', label: 'Supplier-file format', placeholder: 'Select', options: FILE_FORMATS },
              { name: 'problem', label: 'Primary operational problem', placeholder: 'Select', options: PROBLEMS },
            ] as const
          ).map((f) => {
            const err = errors[f.name]
            return (
              <div key={f.name}>
                <label htmlFor={f.name} className={labelCls}>
                  {f.label} {req}
                </label>
                <select
                  id={f.name}
                  defaultValue=""
                  aria-invalid={!!err || undefined}
                  aria-describedby={err ? `${f.name}-error` : undefined}
                  className={cn(controlCls, borderCls(!!err))}
                  {...register(f.name)}
                >
                  <option value="" disabled>
                    {f.placeholder}
                  </option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FieldError id={`${f.name}-error`} message={err?.message} />
              </div>
            )
          })}
        </div>
      </fieldset>

      {/* ── Pilot participation ──────────────────────────────────── */}
      <fieldset className="m-0 mb-7 border-0 p-0">
        <legend className={legendCls}>Pilot participation</legend>

        <fieldset className="m-0 mb-[18px] border-0 p-0">
          <legend className="mb-2.5 block p-0 text-[14px] font-medium">
            Are you willing to provide real or anonymized Amazon and supplier files? {req}
          </legend>
          <div
            className="flex flex-wrap gap-2.5"
            aria-describedby={errors.files ? 'files-error' : undefined}
          >
            {FILE_WILLINGNESS_OPTIONS.map((o) => (
              <label key={o.value} className={radioPill}>
                <input
                  type="radio"
                  value={o.value}
                  className="m-0 accent-accent"
                  aria-invalid={!!errors.files || undefined}
                  {...register('files')}
                />
                {o.label}
              </label>
            ))}
          </div>
          <FieldError id="files-error" message={errors.files?.message} />
        </fieldset>

        <div>
          <label htmlFor="comments" className={labelCls}>
            Comments <span className="font-normal text-ink-faintest">(optional)</span>
          </label>
          <textarea
            id="comments"
            rows={4}
            placeholder="Anything about your suppliers, categories, or current process that would help us evaluate fit."
            className={cn(controlCls, 'resize-y border-line-input leading-[1.55]')}
            {...register('comments')}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Button type="submit" disabled={submitting} className={submitting ? 'bg-[#4a7a7a]' : ''}>
          {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {submitting ? 'Submitting application' : 'Apply for the Pilot'}
        </Button>
        <p className="m-0 max-w-[34ch] text-[13.5px] text-ink-faint">
          Applying does not create a charge. We contact qualified sellers before the pilot starts.
        </p>
      </div>
    </form>
  )
}

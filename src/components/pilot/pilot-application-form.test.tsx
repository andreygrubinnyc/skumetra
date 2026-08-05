import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PilotSubmissionResult } from '@/types/pilot'

// Controllable mock of the submission adapter.
const submitMock = vi.hoisted(() => vi.fn<() => Promise<PilotSubmissionResult>>())
vi.mock('@/lib/services/pilot-submission', () => ({
  submitPilotApplication: submitMock,
  SIMULATED_FAILURE_EMAIL: 'fail@skumetra.test',
}))

import { PilotApplicationForm } from './pilot-application-form'

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full name/i), 'Jordan Reyes')
  await user.type(screen.getByLabelText(/Email/i), 'jordan@northline.com')
  await user.type(screen.getByLabelText(/Business or store name/i), 'Northline Supply Co.')
  await user.click(screen.getByRole('radio', { name: 'Yes, with live listings' }))
  await user.selectOptions(screen.getByLabelText(/Approximate active listings/i), '101-500')
  await user.selectOptions(screen.getByLabelText(/Number of suppliers/i), '2-3')
  await user.selectOptions(screen.getByLabelText(/Supplier-file format/i), 'csv')
  await user.selectOptions(screen.getByLabelText(/Primary operational problem/i), 'stockouts')
  await user.click(screen.getByRole('radio', { name: 'Yes, real files' }))
}

describe('PilotApplicationForm', () => {
  beforeEach(() => {
    submitMock.mockReset()
  })

  it('shows an error summary and field errors on an empty submit', async () => {
    const user = userEvent.setup()
    render(<PilotApplicationForm />)
    await user.click(screen.getByRole('button', { name: /Apply for the Pilot/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/fields still need your attention/i)
    expect(screen.getByText('Please enter your full name.')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    expect(submitMock).not.toHaveBeenCalled()
  })

  it('moves focus to the error summary after a failed validation', async () => {
    const user = userEvent.setup()
    render(<PilotApplicationForm />)
    await user.click(screen.getByRole('button', { name: /Apply for the Pilot/i }))
    const alert = await screen.findByRole('alert')
    await waitFor(() => expect(alert).toHaveFocus())
  })

  it('marks invalid fields with aria-invalid', async () => {
    const user = userEvent.setup()
    render(<PilotApplicationForm />)
    await user.click(screen.getByRole('button', { name: /Apply for the Pilot/i }))
    await screen.findByRole('alert')
    expect(screen.getByLabelText(/Full name/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a loading state while submitting', async () => {
    const user = userEvent.setup()
    let resolve!: (r: PilotSubmissionResult) => void
    submitMock.mockReturnValue(new Promise<PilotSubmissionResult>((r) => (resolve = r)))

    render(<PilotApplicationForm />)
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /Apply for the Pilot/i }))

    const button = await screen.findByRole('button', { name: /Submitting application/i })
    expect(button).toBeDisabled()

    resolve({ ok: true, id: 'pilot_sim_x' })
    await screen.findByText(/Thanks for applying/i)
  })

  it('renders the success state on a successful submission', async () => {
    const user = userEvent.setup()
    submitMock.mockResolvedValue({ ok: true, id: 'pilot_sim_x' })
    render(<PilotApplicationForm />)
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /Apply for the Pilot/i }))

    expect(await screen.findByText(/Thanks for applying/i)).toBeInTheDocument()
    expect(screen.getByText(/contact qualified pilot participants/i)).toBeInTheDocument()
    expect(submitMock).toHaveBeenCalledTimes(1)
  })

  it('shows a submission-error banner when the service fails', async () => {
    const user = userEvent.setup()
    submitMock.mockResolvedValue({ ok: false, error: 'Something went wrong sending your application. Please try again.' })
    render(<PilotApplicationForm />)
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /Apply for the Pilot/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/something went wrong sending your application/i)
    // Stays on the form (no success state).
    expect(screen.queryByText(/Thanks for applying/i)).not.toBeInTheDocument()
  })
})

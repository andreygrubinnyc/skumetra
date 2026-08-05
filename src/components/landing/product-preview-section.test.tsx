import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductPreviewSection } from './product-preview-section'

describe('ProductPreviewSection tabs', () => {
  it('shows the Action Center panel first', () => {
    render(<ProductPreviewSection />)
    expect(screen.getByRole('tab', { name: 'Action Center' })).toHaveAttribute('aria-selected', 'true')
    // Action Center table caption is present.
    expect(screen.getByText(/Sample supplier alerts/i)).toBeInTheDocument()
  })

  it('switches to Protection Rules on click', async () => {
    const user = userEvent.setup()
    render(<ProductPreviewSection />)
    await user.click(screen.getByRole('tab', { name: 'Protection Rules' }))
    expect(screen.getByRole('tab', { name: 'Protection Rules' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Minimum profit')).toBeInTheDocument()
    expect(screen.getByText('Supplier data stale after')).toBeInTheDocument()
  })

  it('switches to Product Matching and shows both records', async () => {
    const user = userEvent.setup()
    render(<ProductPreviewSection />)
    await user.click(screen.getByRole('tab', { name: 'Product Matching' }))
    expect(screen.getByText('7-in-1 USB-C Charging Hub')).toBeInTheDocument()
    expect(screen.getByText('USB-C Charging Hub 7 Port')).toBeInTheDocument()
  })

  it('moves selection with ArrowRight (roving tabindex)', async () => {
    const user = userEvent.setup()
    render(<ProductPreviewSection />)
    const first = screen.getByRole('tab', { name: 'Action Center' })
    first.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Product Matching' })).toHaveAttribute('aria-selected', 'true')
  })
})

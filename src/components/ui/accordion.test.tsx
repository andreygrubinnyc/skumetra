import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion, type AccordionItem } from './accordion'

const items: AccordionItem[] = [
  { id: 'a', header: 'First question', content: <p>First answer</p> },
  { id: 'b', header: 'Second question', content: <p>Second answer</p> },
  { id: 'c', header: 'Third question', content: <p>Third answer</p> },
]

function setup() {
  render(<Accordion items={items} />)
}

describe('Accordion', () => {
  it('renders collapsed by default with aria-expanded=false', () => {
    setup()
    const first = screen.getByRole('button', { name: 'First question' })
    expect(first).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands and collapses on click', async () => {
    const user = userEvent.setup()
    setup()
    const first = screen.getByRole('button', { name: 'First question' })
    await user.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('First answer')).toBeVisible()
    await user.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'false')
  })

  it('single-open: opening one closes the other', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'First question' }))
    await user.click(screen.getByRole('button', { name: 'Second question' }))
    expect(screen.getByRole('button', { name: 'First question' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Second question' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('supports ArrowDown / ArrowUp / Home / End between headers', async () => {
    const user = userEvent.setup()
    setup()
    const [b1, b2, b3] = items.map((i) =>
      screen.getByRole('button', { name: `${i.header}` as string }),
    )
    b1.focus()
    await user.keyboard('{ArrowDown}')
    expect(b2).toHaveFocus()
    await user.keyboard('{End}')
    expect(b3).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(b1).toHaveFocus() // wraps
    await user.keyboard('{ArrowUp}')
    expect(b3).toHaveFocus() // wraps back
    await user.keyboard('{Home}')
    expect(b1).toHaveFocus()
  })

  it('links each panel to its header via aria-controls / aria-labelledby', () => {
    setup()
    const first = screen.getByRole('button', { name: 'First question' })
    const panelId = first.getAttribute('aria-controls')!
    const panel = document.getElementById(panelId)!
    expect(panel).toHaveAttribute('aria-labelledby', first.id)
  })
})

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.describe('accessibility (axe-core, WCAG 2.1 A/AA)', () => {
  test('landing page has no violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(results.violations).toEqual([])
  })

  test('pilot page has no violations', async ({ page }) => {
    await page.goto('/pilot')
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(results.violations).toEqual([])
  })

  test('pilot form error state has no violations', async ({ page }) => {
    await page.goto('/pilot')
    await page.getByRole('button', { name: 'Apply for the Pilot' }).click()
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(results.violations).toEqual([])
  })

  test('privacy placeholder has no violations', async ({ page }) => {
    await page.goto('/privacy')
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(results.violations).toEqual([])
  })
})

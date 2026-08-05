import { test, expect, type Page } from '@playwright/test'

async function fillValidPilotForm(page: Page) {
  await page.getByLabel(/Full name/i).fill('Jordan Reyes')
  await page.getByLabel(/Email/i).fill('jordan@northline.com')
  await page.getByLabel(/Business or store name/i).fill('Northline Supply Co.')
  await page.getByRole('radio', { name: 'Yes, with live listings' }).check()
  await page.getByLabel(/Approximate active listings/i).selectOption('101-500')
  await page.getByLabel(/Number of suppliers/i).selectOption('2-3')
  await page.getByLabel(/Supplier-file format/i).selectOption('csv')
  await page.getByLabel(/Primary operational problem/i).selectOption('stockouts')
  await page.getByRole('radio', { name: 'Yes, real files' }).check()
}

test('1. landing page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Skumetra/)
  await expect(
    page.getByRole('heading', {
      name: /Protect your Amazon listings from supplier stockouts and margin loss/i,
    }),
  ).toBeVisible()
})

test('2. primary CTA opens /pilot', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Join the Founding Seller Pilot' }).first().click()
  await expect(page).toHaveURL(/\/pilot$/)
  await expect(page.getByRole('heading', { name: 'Apply for the Founding Seller Pilot' })).toBeVisible()
})

test('3. secondary CTA scrolls to How It Works', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'See How It Works' }).click()
  await expect(page).toHaveURL(/#how-it-works$/)
  await expect(page.locator('#how-it-works')).toBeInViewport()
})

test('4. product-preview tabs switch', async ({ page }) => {
  await page.goto('/')
  const rulesTab = page.getByRole('tab', { name: 'Protection Rules' })
  await rulesTab.click()
  await expect(rulesTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Max recommended price change')).toBeVisible()

  const matchTab = page.getByRole('tab', { name: 'Product Matching' })
  await matchTab.click()
  await expect(page.getByText('7-in-1 USB-C Charging Hub')).toBeVisible()
})

test('5. pilot form rejects an invalid submission', async ({ page }) => {
  await page.goto('/pilot')
  await page.getByRole('button', { name: 'Apply for the Pilot' }).click()
  // Scope past Next.js's own route-announcer (also role="alert").
  const alert = page.getByRole('alert').filter({ hasText: /need your attention/i })
  await expect(alert).toBeVisible()
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible()
  await expect(page).toHaveURL(/\/pilot$/)
})

test('6. pilot form accepts a valid simulated submission', async ({ page }) => {
  await page.goto('/pilot')
  await fillValidPilotForm(page)
  await page.getByRole('button', { name: 'Apply for the Pilot' }).click()
  await expect(page.getByRole('heading', { name: /Thanks for applying/i })).toBeVisible()
  await expect(page.getByText(/contact qualified pilot participants/i)).toBeVisible()
})

test('7. mobile navigation opens and links work', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Open menu' })
  await expect(toggle).toBeVisible()
  await toggle.click()
  const mobileNav = page.locator('#mobile-nav')
  await expect(mobileNav).toBeVisible()
  await mobileNav.getByRole('link', { name: 'FAQ' }).click()
  await expect(page).toHaveURL(/#faq$/)
})

test('8. privacy and terms placeholders load', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByText(/being finalized for the Founding Seller Pilot/i)).toBeVisible()

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
  await expect(page.getByText(/being finalized for the Founding Seller Pilot/i)).toBeVisible()
})

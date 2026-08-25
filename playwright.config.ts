import { defineConfig, devices } from '@playwright/test'

// Overridable because a hardcoded port silently collides with anything else
// listening locally. Combined with `reuseExistingServer` below, a collision
// makes Playwright test whatever *else* owns the port and report confusing
// element-not-found failures instead of a clear error.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Chromium-engine mobile device so the whole suite runs on one browser download.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})

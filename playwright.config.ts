import { defineConfig, devices } from '@playwright/test'

// Runs against the SPA's mock-data mode (VITE_USE_API unset -> src/data/mock.ts),
// deliberately -- these tests simulate a real user driving the UI end-to-end
// without depending on a live Postgres + API stack, so they run the same way
// on a laptop or in CI. Real-backend flows (login, persisted favorites/alerts)
// are exercised manually against a scratch stack today (see TESTING.md) and
// are a documented follow-up, not covered here.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})

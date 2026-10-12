import { expect, test } from '@playwright/test'

// Regression: ISSUE-001 — on desktop the DóndeTa logo was plain text, so once
// inside a section (with its own header and quick filters) there was no
// obvious way back to the home listing.
// Found by /qa on 2026-10-12
// Report: .gstack/qa-reports/qa-report-dondeta-com-do-2026-10-12.md
test('the desktop logo leaves a section and goes back home', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout only')
  await page.addInitScript(() => sessionStorage.setItem('dondeta_splash_shown', '1'))
  await page.goto('/')

  await page.getByRole('button', { name: 'Categorías', exact: true }).click()
  await page.getByRole('button', { name: /Electrodomésticos/ }).click()
  await expect(page.getByRole('group', { name: 'Filtrar sección' }).or(page.getByRole('heading', { name: 'Electrodomésticos' }))).toBeVisible()

  await page.getByRole('button', { name: 'DóndeTa, ir al inicio' }).click()
  await expect(page.getByRole('heading', { name: 'Electrodomésticos' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Todos los productos' })).toBeVisible()
})

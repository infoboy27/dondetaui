import { expect, test } from '@playwright/test'

// Regression: on phones the tab bar was drawn over the product page's fixed
// action bar, so "Ver oferta en…" (the click that sends a visit to the store)
// could not be tapped.
test('the product page action bar is not covered by the tab bar', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile layout only')
  // The once-per-session splash would otherwise sit on top of everything.
  await page.addInitScript(() => sessionStorage.setItem('dondeta_splash_shown', '1'))
  await page.goto('/product/samsung-wa18t6360bv')

  const cta = page.getByText(/Ver oferta en|Oferta no disponible/).first()
  await expect(cta).toBeVisible()
  const box = await cta.boundingBox()
  expect(box).not.toBeNull()
  const covered = await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('nav')), {
    x: box!.x + box!.width / 2,
    y: box!.y + box!.height / 2,
  })
  expect(covered).toBe(false)
})

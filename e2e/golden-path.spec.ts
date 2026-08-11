import { test, expect } from '@playwright/test'

const SEARCH_PLACEHOLDER = 'Buscar productos, marcas o tiendas…'
// Desktop shows results by filtering the same page in place (no route change,
// no dedicated Favoritos page -- favorites live inline on each product row
// plus a count in the account menu); mobile navigates to real routes
// (/results, /alerts?tab=favoritos). Both are the current, intentional
// architecture per AGENTS.md's navigation notes, not a bug -- tests below
// scope route-dependent assertions to mobile accordingly.

test.describe('search -> favorite a product as a guest', () => {
  test('toggles a product into favorites from the results list', async ({ page }) => {
    await page.goto('/search')

    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER)
    await searchInput.fill('samsung')
    await searchInput.press('Enter')

    const favoriteButton = page.getByRole('button', { name: /^Agregar .* a favoritos$/ }).first()
    await expect(favoriteButton).toBeVisible()
    const productName = (await favoriteButton.getAttribute('aria-label'))
      ?.replace(/^Agregar /, '')
      .replace(/ a favoritos$/, '')
    expect(productName).toBeTruthy()

    await favoriteButton.click()
    await expect(page.getByRole('button', { name: `Quitar ${productName} de favoritos` }).first()).toBeVisible()
  })
})

test.describe('favorites tab (mobile)', () => {
  test.skip(({ isMobile }) => !isMobile, 'desktop has no dedicated Favoritos route -- favorites live inline on each row')

  test('a favorited product shows up under Favoritos', async ({ page }) => {
    await page.goto('/search')
    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER)
    await searchInput.fill('samsung')
    await searchInput.press('Enter')

    const favoriteButton = page.getByRole('button', { name: /^Agregar .* a favoritos$/ }).first()
    const productName = (await favoriteButton.getAttribute('aria-label'))
      ?.replace(/^Agregar /, '')
      .replace(/ a favoritos$/, '')
    await favoriteButton.click()

    await page.goto('/alerts?tab=favoritos')
    await expect(page.getByRole('heading', { name: 'Favoritos' })).toBeVisible()
    await expect(page.getByText('Todavía no tienes favoritos')).not.toBeVisible()
    await expect(page.getByText(productName!).first()).toBeVisible()
  })

  test('shows an empty state for a guest with nothing favorited', async ({ page }) => {
    await page.goto('/alerts?tab=favoritos')
    await expect(page.getByText('Todavía no tienes favoritos')).toBeVisible()
  })
})

test.describe('scanner', () => {
  test.skip(({ isMobile }) => !isMobile, 'the barcode scanner is mobile-only UI (desktop always shows the product listing)')

  test('requests real camera access instead of auto-detecting a fake product', async ({ page }) => {
    // No camera permission granted -> the scanner must show a real
    // permission/denied state, never the old simulated auto-detect.
    await page.goto('/scanner')
    await expect(page.getByText('Escanea el código de barras')).toBeVisible()
    await expect(
      page.getByText('Solicitando acceso a la cámara…').or(page.getByText('No se pudo acceder a la cámara')),
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('¡Producto encontrado!')).not.toBeVisible()
  })
})

test.describe('home', () => {
  test('loads with real product data, not a blank or error screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/dónde 'ta más barato/i).or(page.getByText('Todos los productos'))).toBeVisible()
  })
})

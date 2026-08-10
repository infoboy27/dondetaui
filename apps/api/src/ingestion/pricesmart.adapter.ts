import type { Page } from 'playwright'
import type { NormalizedRetailerItem } from './ingestion.types'

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'otros'
}

function parsePrice(text: string): number {
  const match = text.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/)
  if (!match) throw new Error('PriceSmart parser: product price not found')
  return Number(match[1].replace(/,/g, ''))
}

export class PriceSmartAdapter {
  constructor(private readonly page: Page) {}

  async fetchProduct(url: string): Promise<NormalizedRetailerItem> {
    // No JSON-LD or SSR'd state on PriceSmart's PDP (see discovery.ts) — the content is
    // in the live DOM only, once the app's own client-side fetch resolves.
    const response = await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    if (response && !response.ok()) {
      throw new Error(`PriceSmart request failed (${response.status()}) for ${url}`)
    }
    await this.page.waitForSelector('h1', { timeout: 15_000 })

    const name = (await this.page.locator('h1').first().innerText()).trim()
    if (!name) throw new Error('PriceSmart parser: product name not found')

    const brand = (await this.page.locator('.product-brand').first().innerText().catch(() => '')).trim() || 'Desconocida'

    const priceText = await this.page.locator('.sf-price__regular').first().innerText().catch(() => '')
    const price = parsePrice(priceText)

    const model = (await this.page.locator('.product-title__item-number .sf-property__value').first().innerText().catch(() => '')).trim()
      || (url.match(/\/(\d{4,})(?:\?.*)?$/)?.[1] ?? slugify(name))

    // Breadcrumb reads "PriceSmart | Línea blanca | <subcategory> | <product name>" — the
    // subcategory (second-to-last crumb) is the real category, not the product name itself.
    // The page also has a site-nav <nav> before this one, so target the breadcrumb
    // specifically rather than grabbing whichever <nav> comes first.
    const breadcrumb = await this.page.locator('nav[aria-label="breadcrumb"]').first().innerText().catch(() => '')
    const crumbs = breadcrumb.split('\n').map(part => part.trim()).filter(Boolean)
    const categoryName = crumbs.length >= 2 ? crumbs[crumbs.length - 2] : 'Línea Blanca'

    const imageUrl = await this.page.locator('img[src*="cloudfront.net"]').first().getAttribute('src').catch(() => null)

    const bodyText = await this.page.innerText('body').catch(() => '')
    const available = !/agotado|sin existencias|no disponible/i.test(bodyText)

    return {
      retailer: {
        name: 'PriceSmart',
        slug: 'pricesmart',
        abbr: 'PS',
        primaryColor: '#00529B',
        websiteUrl: 'https://www.pricesmart.com/es-do',
      },
      externalSku: model,
      sourceUrl: url,
      name,
      brand,
      model,
      categoryName,
      categorySlug: slugify(categoryName),
      imageUrl: imageUrl ?? undefined,
      price,
      shippingPrice: 0,
      available,
      raw: {
        source: 'pricesmart-html',
        fetchedAt: new Date().toISOString(),
        url,
        name,
        brand,
        model,
        price,
        available,
        category: categoryName,
      },
    }
  }
}

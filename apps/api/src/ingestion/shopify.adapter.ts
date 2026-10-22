import { normalizeBrand } from './brands'
import { extractModelCodes } from './model-codes'
import { acceptsCategory } from './ingestion.repository'
import { politeFetch, sleep } from './polite-fetch'
import type { NormalizedRetailerItem } from './ingestion.types'

// Shopify stores publish their whole catalog at /products.json (up to 250 per
// page: price, previous price, vendor, type and availability), which their
// robots.txt allows. One adapter, one config per store.
export interface ShopifyConfig {
  origin: string
  retailer: NormalizedRetailerItem['retailer']
  /** product_type values (slugified) that are not appliances: sinks, faucets, cookware. */
  excludedTypes: string[]
  source: string
}

export const ELECTRODOM_CONFIG: ShopifyConfig = {
  origin: 'https://www.electrodom.com.do',
  retailer: { name: 'Electrodom', slug: 'electrodom', abbr: 'ED', primaryColor: '#D62828', websiteUrl: 'https://www.electrodom.com.do' },
  excludedTypes: ['fregadero', 'griferia', 'juego-de-ollas-y-sartenes'],
  source: 'electrodom-shopify-api',
}

export interface ShopifyProduct {
  id: number
  title: string
  handle: string
  vendor?: string
  product_type?: string
  images?: { src: string }[]
  variants: { price: string; compare_at_price?: string | null; sku?: string | null; barcode?: string | null; available?: boolean }[]
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export class ShopifyAdapter {
  constructor(private readonly config: ShopifyConfig, private readonly delayMs = 2_000) {}

  async fetchPage(page: number): Promise<ShopifyProduct[]> {
    const response = await politeFetch(`${this.config.origin}/products.json?limit=250&page=${page}`)
    const body = (await response.json()) as { products?: ShopifyProduct[] }
    await sleep(this.delayMs)
    return body.products ?? []
  }

  normalize(product: ShopifyProduct): NormalizedRetailerItem | null {
    const variant = product.variants[0]
    const price = Number(variant?.price)
    if (!product.title || !Number.isFinite(price) || price <= 0) return null

    const type = product.product_type?.trim() ?? ''
    if (this.config.excludedTypes.includes(slugify(type))) return null

    // Store types ("Estufa", "Vinera") become category names; any that don't read
    // as an appliance category fall back to the generic one the repository accepts.
    const retailer = this.config.retailer
    const category = type && acceptsCategory({ categoryName: type, categorySlug: slugify(type), retailer })
      ? { name: type, slug: slugify(type) }
      : { name: 'Electrodomésticos', slug: 'electrodomesticos' }

    const vendor = product.vendor?.trim()
    return {
      retailer,
      externalSku: String(product.id),
      sourceUrl: `${this.config.origin}/products/${product.handle}`,
      name: product.title.trim(),
      brand: vendor ? normalizeBrand(vendor) : 'Desconocida',
      // Titles without a model code (the store's own brand) use the product id; the
      // product type is shown under the name instead of that opaque id.
      model: extractModelCodes(product.title)[0] ?? String(product.id),
      subtitle: type || undefined,
      ean: variant?.barcode && variant.barcode.length >= 12 ? variant.barcode : undefined,
      categoryName: category.name,
      categorySlug: category.slug,
      imageUrl: product.images?.[0]?.src,
      price,
      shippingPrice: 0,
      available: product.variants.some(v => v.available !== false),
      raw: {
        source: this.config.source,
        fetchedAt: new Date().toISOString(),
        productId: product.id,
        compareAtPrice: variant?.compare_at_price ?? null,
      },
    }
  }
}

import type { NormalizedRetailerItem } from './ingestion.types'
import type { VtexRetailerConfig } from './vtex-api.config'

// VTEX's standard product search response shape -- only the fields this
// adapter actually reads. Real responses carry much more (clusters,
// specifications, SEO fields) that isn't needed here.
interface VtexSeller {
  // Yes, "commertialOffer" -- VTEX's own (slightly misspelled) field name,
  // confirmed against a live response, not "commertOffer"/"commercialOffer".
  commertialOffer?: {
    Price?: number
    ListPrice?: number
    IsAvailable?: boolean
    AvailableQuantity?: number
  }
}

interface VtexItem {
  itemId: string
  ean?: string
  referenceId?: { Key: string; Value: string }[]
  images?: { imageUrl?: string }[]
  sellers?: VtexSeller[]
}

interface VtexProduct {
  productId: string
  productName: string
  brand?: string
  link: string
  categories?: string[]
  items?: VtexItem[]
}

// Strips NFD-decomposed combining diacritical marks (Unicode block
// U+0300-U+036F) by codepoint comparison rather than a \uXXXX-\uYYYY
// regex range literal, which this editing environment keeps mangling into
// literal combining characters instead of the escape-sequence text.
function stripDiacritics(value: string): string {
  return [...value].filter(char => {
    const code = char.codePointAt(0) ?? 0
    return code < 0x300 || code > 0x36f
  }).join('')
}

function slugify(value: string): string {
  return stripDiacritics(value.normalize('NFD')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'otros'
}

// VTEX's `categories` field is an array of full breadcrumb paths, e.g.
// "/Línea blanca/Cocina/Estufas/" -- the last non-empty segment is the
// most specific real category, same principle as the HTML adapter's
// breadcrumb extraction.
function mostSpecificCategory(categories: string[] | undefined, fallback: { name: string; slug: string }) {
  const path = categories?.[0]
  if (!path) return fallback
  const segments = path.split('/').filter(Boolean)
  const name = segments.at(-1)
  return name ? { name, slug: slugify(name) } : fallback
}

// A product can have multiple sellers per item (marketplace listings) --
// prefer the lowest available price, same ranking principle as
// src/domain/offers.ts uses on the frontend.
function bestOffer(item: VtexItem): { price: number; available: boolean } | null {
  const offers = (item.sellers ?? [])
    .map(seller => seller.commertialOffer)
    .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer) && typeof offer!.Price === 'number' && offer!.Price! > 0)

  if (!offers.length) return null
  const available = offers.find(offer => offer.IsAvailable) ?? offers[0]
  return { price: available.Price!, available: Boolean(available.IsAvailable) }
}

export class VtexApiAdapter {
  constructor(private readonly config: VtexRetailerConfig) {}

  // Fetches one page (VTEX caps _to - _from at 49 per request) of a given
  // category path's search results.
  async fetchPage(categoryPath: string, from: number, to: number): Promise<VtexProduct[]> {
    const url = `${this.config.websiteUrl}/api/catalog_system/pub/products/search/${categoryPath}?_from=${from}&_to=${to}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': `DondeTaPriceIndexer/0.3 (${this.config.slug}; +https://dondeta.app)`,
        Accept: 'application/json',
      },
    })
    // VTEX returns 206 for a partial page (more results exist beyond this
    // range) and 200 when the range covers everything -- both are success.
    if (!response.ok && response.status !== 206) {
      throw new Error(`${this.config.name}: VTEX search failed (${response.status}) for ${categoryPath}`)
    }
    return response.json() as Promise<VtexProduct[]>
  }

  normalize(product: VtexProduct): NormalizedRetailerItem | null {
    const item = product.items?.[0]
    if (!item) return null
    const offer = bestOffer(item)
    if (!offer) return null

    const category = mostSpecificCategory(product.categories, this.config.defaultCategory)
    const ean = item.ean && item.ean.length >= 12 ? item.ean : undefined
    const refId = item.referenceId?.find(ref => ref.Key === 'RefId')?.Value

    return {
      retailer: {
        name: this.config.name, slug: this.config.slug, abbr: this.config.abbr,
        primaryColor: this.config.primaryColor, websiteUrl: this.config.websiteUrl,
      },
      externalSku: refId ?? item.itemId,
      sourceUrl: product.link,
      name: product.productName,
      brand: product.brand?.trim() || product.productName.split(/\s+/)[0] || 'Desconocida',
      model: refId ?? item.itemId,
      ean,
      categoryName: category.name,
      categorySlug: category.slug,
      imageUrl: item.images?.[0]?.imageUrl,
      price: offer.price,
      shippingPrice: 0,
      available: offer.available,
      raw: { source: `${this.config.slug}-vtex-api`, fetchedAt: new Date().toISOString(), productId: product.productId, itemId: item.itemId },
    }
  }
}

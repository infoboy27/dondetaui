import { brandFromName, normalizeBrand } from './brands'
import { extractModelCodes } from './model-codes'
import { politeFetch, sleep } from './polite-fetch'
import type { NormalizedRetailerItem } from './ingestion.types'

// Cecomsa (cecomsa.com) runs Odoo eCommerce: /shop/category/<name>-<id>/page/N
// renders 20 server-side product cards with name, internal code, price (ITBIS
// included) and image. Its robots.txt allows /shop. Only appliance and TV
// departments are crawled: the store also sells printers, phones and supplies.
export const CECOMSA_ORIGIN = 'https://www.cecomsa.com'

export interface CecomsaSeed {
  path: string
  categoryName: string
  categorySlug: string
}

export const CECOMSA_SEEDS: CecomsaSeed[] = [
  { path: '/shop/category/electrodomesticos-linea-blanca-aires-acondicionados-2000', categoryName: 'Aires acondicionados', categorySlug: 'aires-acondicionados' },
  { path: '/shop/category/electrodomesticos-linea-blanca-calentadores-de-agua-2008', categoryName: 'Electrodomésticos', categorySlug: 'electrodomesticos' },
  { path: '/shop/category/electrodomesticos-linea-blanca-extractores-2076', categoryName: 'Extractores', categorySlug: 'extractores' },
  { path: '/shop/category/electrodomesticos-linea-blanca-hornos-y-estufas-2077', categoryName: 'Estufas y hornos', categorySlug: 'estufas' },
  { path: '/shop/category/electrodomesticos-linea-blanca-lavadoras-2081', categoryName: 'Lavadoras', categorySlug: 'lavadoras' },
  { path: '/shop/category/electrodomesticos-linea-blanca-microondas-2082', categoryName: 'Microondas', categorySlug: 'microondas' },
  { path: '/shop/category/electrodomesticos-linea-blanca-refrigeracion-2083', categoryName: 'Refrigeración', categorySlug: 'neveras' },
  { path: '/shop/category/electronicos-video-tv-televisor-2330', categoryName: 'Televisores', categorySlug: 'televisores' },
]

export interface CecomsaListingItem {
  name: string
  path: string
  code: string
  price: number
  imageUrl?: string
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

const NAME_LINK = /<a\b[^>]*itemprop="name"[^>]*>/g

/** Reads the product cards of one /shop listing page. */
export function parseListing(html: string): CecomsaListingItem[] {
  const links = [...html.matchAll(NAME_LINK)]
  const items: CecomsaListingItem[] = []
  let previousEnd = 0

  links.forEach((match, i) => {
    const tag = match[0]
    const start = match.index ?? 0
    const nextStart = links[i + 1]?.index ?? html.length
    const name = /\btitle="([^"]*)"/.exec(tag)?.[1]
    const path = /\bhref="([^"]*)"/.exec(tag)?.[1]
    const after = html.slice(start, nextStart)
    const code = /itemprop="sku"[^>]*>\s*(?:C[OÓ]DIGO:)?\s*([^<\s][^<]*?)\s*</i.exec(after)?.[1]
    const price = Number(/itemprop="price"[^>]*>\s*([\d.,]+)\s*</.exec(after)?.[1])

    // The card's image comes before its title link.
    const before = html.slice(previousEnd, start)
    const image = [...before.matchAll(/<img\b[^>]*itemprop="image"[^>]*\bsrc="([^"]+)"/g)].at(-1)?.[1]
    previousEnd = start + tag.length

    if (!name || !path || !code || !Number.isFinite(price) || price <= 0) return
    items.push({
      name: decodeEntities(name),
      path: path.split('?')[0]!,
      code: decodeEntities(code),
      price,
      imageUrl: image ? (image.startsWith('//') ? `https:${image}` : image) : undefined,
    })
  })
  return items
}

export function normalizeCecomsaItem(item: CecomsaListingItem, seed: CecomsaSeed): NormalizedRetailerItem {
  const brand = brandFromName(item.name)
  return {
    retailer: { name: 'Cecomsa', slug: 'cecomsa', abbr: 'CE', primaryColor: '#0057B8', websiteUrl: CECOMSA_ORIGIN },
    externalSku: item.code,
    sourceUrl: `${CECOMSA_ORIGIN}${item.path}`,
    name: item.name,
    // Cecomsa distributes KTC: the few names that omit the brand ("ACONDICIONADOR DE AIRE SPLIT
    // INVERTER… CEAG15-24…") are KTC models too.
    brand: brand ? normalizeBrand(brand) : 'KTC',
    model: extractModelCodes(item.name)[0] ?? item.code,
    categoryName: seed.categoryName,
    categorySlug: seed.categorySlug,
    imageUrl: item.imageUrl,
    price: item.price,
    shippingPrice: 0,
    // A card with a price and "Agregar al carrito" is purchasable online.
    available: true,
    raw: { source: 'cecomsa-odoo-shop', fetchedAt: new Date().toISOString(), code: item.code },
  }
}

export class CecomsaAdapter {
  constructor(private readonly delayMs = 800) {}

  async fetchListing(seed: CecomsaSeed, page: number): Promise<CecomsaListingItem[]> {
    const url = `${CECOMSA_ORIGIN}${seed.path}${page > 1 ? `/page/${page}` : ''}`
    const response = await politeFetch(url)
    const items = parseListing(await response.text())
    await sleep(this.delayMs)
    return items
  }
}

import { brandFromName, normalizeBrand } from './brands'
import { politeFetch, sleep } from './polite-fetch'
import type { NormalizedRetailerItem } from './ingestion.types'

// HI-FI Electrodomésticos (hifi.com.do) is a Laravel + Inertia site: every
// category page (/linea-blanca?page=N, 8 per page) embeds its products as JSON
// in the root element's data-page attribute, with list price, discount,
// stock, images and the product's categories (brand pages are categories
// too). Its robots.txt allows everything but cart/account pages.
export const HIFI_ORIGIN = 'https://hifi.com.do'

export const HIFI_RETAILER: NormalizedRetailerItem['retailer'] = {
  name: 'HI-FI',
  slug: 'hifi',
  abbr: 'HF',
  primaryColor: '#0F1D39',
  websiteUrl: HIFI_ORIGIN,
}

// Top-level departments crawled; products repeat across them (and in
// "ofertas"), so the CLI de-duplicates by product id.
export const HIFI_SEEDS = [
  'linea-blanca',
  'refrigeracion',
  'estufas',
  'hornos',
  'microondas',
  'extractores',
  'lavado',
  'aires-y-abanicos',
  'electronica',
  'pequenos-electrodomesticos',
  'ofertas',
]

// Hi-Fi category slug → DóndeTa category, most specific first. Names match the
// ones other adapters use for the same slug (the ingestion upsert renames a
// category to the last name it sees).
const CATEGORY_MAP: Array<[string[], { name: string; slug: string }]> = [
  [['televisores'], { name: 'Televisores', slug: 'televisores' }],
  [['equipos-de-sonido', 'bocinas-minicomponentes'], { name: 'Audio', slug: 'audio' }],
  [['splits'], { name: 'Aires acondicionados', slug: 'aires-acondicionados' }],
  [['abanicos'], { name: 'Ventiladores', slug: 'ventiladores' }],
  [['lavadoras', 'twin-tub'], { name: 'Lavadoras', slug: 'lavadoras' }],
  [['secadoras'], { name: 'Secadoras', slug: 'secadoras' }],
  [['lavavajillas'], { name: 'Lavaplatos', slug: 'lavaplatos' }],
  [['microondas'], { name: 'Microondas', slug: 'microondas' }],
  [['extractores'], { name: 'Extractores', slug: 'extractores' }],
  [['estufas', 'estufa-con-horno', 'topes', 'hornos'], { name: 'Estufas', slug: 'estufas' }],
  // Not the "refrigeracion" department: it also holds water dispensers and ice makers.
  [['neveras', 'neveras-ejecutivas', 'freezers', 'vineras', 'exhibidores'], { name: 'Neveras', slug: 'neveras' }],
  [['aspiradoras'], { name: 'Aspiradoras', slug: 'aspiradoras' }],
  [['licuadoras'], { name: 'Licuadoras', slug: 'licuadoras' }],
  [
    [
      'bebederos', 'fabrica-de-hielo', 'batidoras', 'cafeteras', 'wafleras-tostadoras-grill', 'procesador-de-alimentos',
      'planchas', 'extractores-de-jugo', 'freidoras-de-aire', 'estufas-hornos-electricos', 'purificadores-deshumidificadores',
      'otros-pequenos', 'pequenos-electrodomesticos', 'refrigeracion', 'linea-blanca', 'lavado', 'aires-y-abanicos', 'electronica',
    ],
    { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  ],
]

const MAPPED_SLUGS = new Set(CATEGORY_MAP.flatMap(([slugs]) => slugs))

// Cookware, personal care, spare parts and accessories aren't appliances.
const EXCLUDED_CATEGORIES = new Set(['ollas-cuchillos', 'cuidado-personal', 'articulos-cuidado-personal', 'repuestos', 'accesorios'])

// Category tag used for brand pages (/kenmore, /whirlpool…).
const BRAND_TAG_ID = 4

export interface HifiCategory {
  id: number
  name: string
  slug: string
  tag_id?: number | null
}

export interface HifiProduct {
  id: number
  name: string
  slug: string
  status?: string
  sku?: string | null
  price: number | string
  discount?: number | string | null
  stock?: number | null
  categories?: HifiCategory[]
  files?: { path: string }[]
  card_discount?: { name?: string; percentage?: string | number } | null
}

export interface HifiListingPage {
  products: HifiProduct[]
  currentPage: number
  lastPage: number
}

function decodeAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Reads the Inertia page JSON of one category listing page. */
export function parseListingPage(html: string): HifiListingPage {
  const attribute = /\bdata-page="([^"]*)"/.exec(html)?.[1]
  if (!attribute) throw new Error('HI-FI page has no Inertia data-page attribute')
  const page = JSON.parse(decodeAttribute(attribute)) as {
    props?: { products?: { data?: HifiProduct[]; current_page?: number; last_page?: number } }
  }
  const products = page.props?.products
  if (!products?.data) throw new Error('HI-FI page has no product list')
  return {
    products: products.data,
    currentPage: Number(products.current_page ?? 1),
    lastPage: Number(products.last_page ?? 1),
  }
}

/** Price after the store-wide discount, as the product page shows it (card discounts are separate). */
export function hifiFinalPrice(product: Pick<HifiProduct, 'price' | 'discount'>): number {
  const price = Number(product.price)
  const discount = Number(product.discount ?? 0)
  if (!Number.isFinite(price) || price <= 0) return NaN
  const rate = Number.isFinite(discount) && discount > 0 && discount < 100 ? discount / 100 : 0
  return Math.round(price * (1 - rate) * 100) / 100
}

export function hifiCategory(product: Pick<HifiProduct, 'categories'>): { name: string; slug: string } | null {
  const slugs = new Set((product.categories ?? []).map(category => category.slug))
  if ([...slugs].some(slug => EXCLUDED_CATEGORIES.has(slug))) return null
  for (const [hifiSlugs, category] of CATEGORY_MAP) {
    if (hifiSlugs.some(slug => slugs.has(slug))) return category
  }
  return null
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase())
}

export function normalizeHifiProduct(product: HifiProduct): NormalizedRetailerItem | null {
  const price = hifiFinalPrice(product)
  if (!product.name || !Number.isFinite(price) || price <= 0) return null
  if (product.status && product.status !== 'active') return null
  const category = hifiCategory(product)
  if (!category) return null

  // Brand pages share the tag with a few product-type pages (/twin-tub).
  const brandCategory = product.categories?.find(c => c.tag_id === BRAND_TAG_ID && !MAPPED_SLUGS.has(c.slug))?.name
  const brand = brandCategory ?? brandFromName(product.name)
  const name = titleCase(product.name.replace(/\s+/g, ' ').trim())
  const sku = product.sku?.trim()
  // Product URLs take any first segment; the store's own links use the
  // product's first category.
  const section = product.categories?.[0]?.slug ?? 'linea-blanca'
  const image = product.files?.[0]?.path

  return {
    retailer: HIFI_RETAILER,
    externalSku: String(product.id),
    sourceUrl: `${HIFI_ORIGIN}/${section}/${product.slug}`,
    name,
    brand: brand ? normalizeBrand(brand) : 'Desconocida',
    // Hi-Fi's sku is the manufacturer model code (WWI12ASHLS, BTCSWS).
    model: sku || String(product.id),
    categoryName: category.name,
    categorySlug: category.slug,
    imageUrl: image ? `${HIFI_ORIGIN}/storage/${image.replace(/^\/+/, '')}` : undefined,
    price,
    shippingPrice: 0,
    available: Number(product.stock ?? 0) > 0,
    raw: {
      source: 'hifi-inertia',
      fetchedAt: new Date().toISOString(),
      productId: product.id,
      listPrice: Number(product.price),
      discount: Number(product.discount ?? 0),
      cardDiscount: product.card_discount?.name ?? null,
    },
  }
}

export class HifiAdapter {
  constructor(private readonly delayMs = 1_000) {}

  async fetchListing(category: string, page: number): Promise<HifiListingPage> {
    const response = await politeFetch(`${HIFI_ORIGIN}/${category}${page > 1 ? `?page=${page}` : ''}`)
    const listing = parseListingPage(await response.text())
    await sleep(this.delayMs)
    return listing
  }
}

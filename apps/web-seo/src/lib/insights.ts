import { getBestOffer, getOfferTotal } from './offers'
import type { Product } from './types'

// Data-driven landing pages ("precio de neveras en RD", "bajas de precio"):
// every number on them is computed from the live catalog, so they're unique,
// current content rather than templated filler.

export interface ProductType {
  slug: string
  label: string // plural, lower-case friendly: "neveras"
  title: string // "Neveras y refrigeradores"
  keywords: string[] // matched against the product name (accent-insensitive)
  exclude?: string[] // accessories that mention the keyword ("base para nevera")
  minPrice: number // below this it's an accessory/part, not the appliance
}

// The searches people actually make for appliances in DR. Matching is on the
// product name because store categories are inconsistent across retailers.
export const PRODUCT_TYPES: ProductType[] = [
  { slug: 'neveras', label: 'neveras', title: 'Neveras y refrigeradores', keywords: ['nevera', 'refrigerador', 'refrigeradora', 'side by side'], exclude: ['base', 'filtro', 'kit', 'cubeta', 'bebida'], minPrice: 8_000 },
  { slug: 'lavadoras', label: 'lavadoras', title: 'Lavadoras', keywords: ['lavadora'], exclude: ['kit', 'base', 'manguera', 'secadora'], minPrice: 7_000 },
  { slug: 'secadoras', label: 'secadoras', title: 'Secadoras de ropa', keywords: ['secadora'], exclude: ['pelo', 'cabello', 'kit', 'lavadora', 'ducto'], minPrice: 7_000 },
  { slug: 'centros-de-lavado', label: 'centros de lavado', title: 'Centros de lavado (lavadora y secadora)', keywords: ['lavadora y secadora', 'lavadora secadora', 'lavadora/secadora', 'centro de lavado', 'torre'], exclude: ['kit'], minPrice: 15_000 },
  { slug: 'estufas', label: 'estufas', title: 'Estufas y cocinas', keywords: ['estufa', 'cocina a gas', 'cocina electrica'], exclude: ['butano', 'camping', 'parrilla', 'repuesto', 'quemador'], minPrice: 5_000 },
  { slug: 'aires-acondicionados', label: 'aires acondicionados', title: 'Aires acondicionados', keywords: ['aire acondicionado', 'a/a', 'inverter', 'btu'], exclude: ['control', 'soporte', 'base', 'kit', 'purificador', 'deshumidificador', 'deshumificador'], minPrice: 10_000 },
  { slug: 'televisores', label: 'televisores', title: 'Televisores', keywords: ['televisor', 'smart tv', ' tv ', 'pulgadas', 'qled', 'oled', 'uhd'], exclude: ['soporte', 'base', 'control', 'cable', 'bocina', 'barra', 'abanico', 'ventilador', 'extractor', 'campana', 'estufa', 'lavaplatos'], minPrice: 6_000 },
  { slug: 'microondas', label: 'microondas', title: 'Microondas', keywords: ['microondas', 'microonda'], exclude: ['soporte', 'base', 'plato'], minPrice: 2_500 },
  { slug: 'freidoras-de-aire', label: 'freidoras de aire', title: 'Freidoras de aire', keywords: ['freidora de aire', 'air fryer', 'freidora'], exclude: ['papel', 'molde', 'accesorio', 'canasta'], minPrice: 1_500 },
  { slug: 'abanicos', label: 'abanicos', title: 'Abanicos y ventiladores', keywords: ['abanico', 'ventilador'], exclude: ['repuesto', 'aspa', 'cuello'], minPrice: 900 },
  { slug: 'licuadoras', label: 'licuadoras', title: 'Licuadoras', keywords: ['licuadora'], exclude: ['vaso', 'cuchilla', 'tapa', 'rosca', 'repuesto', 'jarra'], minPrice: 1_200 },
  { slug: 'lavaplatos', label: 'lavaplatos', title: 'Lavaplatos', keywords: ['lavaplatos', 'lavavajillas'], minPrice: 10_000 },
  { slug: 'congeladores', label: 'congeladores', title: 'Congeladores (freezers)', keywords: ['congelador', 'freezer'], exclude: ['nevera', 'refrigerador'], minPrice: 8_000 },
]

function normalize(text: string): string {
  return ` ${text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()} `
}

export function bestPrice(product: Product): number | undefined {
  const offer = getBestOffer(product.prices)
  return offer ? getOfferTotal(offer) : undefined
}

export function matchesType(product: Product, type: ProductType): boolean {
  const name = normalize(product.name)
  if (!type.keywords.some(keyword => name.includes(normalize(keyword).trim()))) return false
  // Whole words only: "kit" must not exclude KitchenAid, nor "quemador" every
  // stove "de 5 quemadores".
  const words = ` ${name.replace(/[^a-z0-9]+/g, ' ').trim()} `
  if (type.exclude?.some(word => words.includes(` ${normalize(word).trim()} `))) return false
  const price = bestPrice(product)
  return price !== undefined && price >= type.minPrice
}

export function storeCount(product: Product): number {
  return new Set(product.prices.map(offer => offer.store)).size
}

export function savings(product: Product): number {
  const available = product.prices.filter(offer => offer.available)
  if (new Set(available.map(o => o.store)).size < 2) return 0
  const totals = available.map(getOfferTotal)
  return Math.max(...totals) - Math.min(...totals)
}

export interface Comparison {
  product: Product
  savings: number
  cheapest: string
  priciest: string
}

export function topComparisons(products: Product[], limit = 10): Comparison[] {
  return products
    .map(product => {
      const available = product.prices.filter(o => o.available).sort((a, b) => getOfferTotal(a) - getOfferTotal(b))
      return {
        product,
        savings: savings(product),
        cheapest: available[0]?.store ?? '',
        priciest: available[available.length - 1]?.store ?? '',
      }
    })
    .filter(c => c.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, limit)
}

export interface PriceDrop {
  product: Product
  pct: number
  oldPrice: number
  newPrice: number
  date: string
}

// Latest move in the price history, if it went down by at least minPct.
export function topDrops(products: Product[], limit = 10, minPct = 3): PriceDrop[] {
  const drops: PriceDrop[] = []
  for (const product of products) {
    const history = product.priceHistory ?? []
    if (history.length < 2) continue
    const previous = history[history.length - 2]
    const latest = history[history.length - 1]
    if (latest.price >= previous.price) continue
    const pct = Math.round(((previous.price - latest.price) / previous.price) * 100)
    if (pct >= minPct) drops.push({ product, pct, oldPrice: previous.price, newPrice: latest.price, date: latest.date })
  }
  return drops.sort((a, b) => b.pct - a.pct).slice(0, limit)
}

export interface TypeStats {
  count: number
  stores: number
  min: number
  max: number
  median: number
  compared: number
  // Retailer that's cheapest most often among products sold by 2+ stores.
  cheapestStore: { name: string; share: number } | null
}

export function typeStats(products: Product[]): TypeStats | null {
  const prices = products.map(bestPrice).filter((p): p is number => p !== undefined).sort((a, b) => a - b)
  if (!prices.length) return null
  const compared = products.filter(p => storeCount(p) > 1)
  const wins = new Map<string, number>()
  for (const product of compared) {
    const store = getBestOffer(product.prices)?.store
    if (store) wins.set(store, (wins.get(store) ?? 0) + 1)
  }
  const top = [...wins.entries()].sort((a, b) => b[1] - a[1])[0]
  return {
    count: products.length,
    stores: new Set(products.flatMap(p => p.prices.map(o => o.store))).size,
    min: prices[0],
    max: prices[prices.length - 1],
    median: prices[Math.floor(prices.length / 2)],
    compared: compared.length,
    cheapestStore: top && compared.length >= 3 ? { name: top[0], share: Math.round((top[1] / compared.length) * 100) } : null,
  }
}

export function monthYear(date = new Date()): string {
  return date.toLocaleDateString('es-DO', { month: 'long', year: 'numeric', timeZone: 'America/Santo_Domingo' })
}

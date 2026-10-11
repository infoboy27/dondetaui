import type { Product } from '../types'
import { getBestOffer, getOfferTotal } from './offers'

// Content rules for the Instagram autopilot (src/screens/admin/IgRender.tsx).
// Pure, so they're testable without a canvas.

// A comparison is only worth a post when the gap is something people feel:
// RD$1,000+, or 10%+ of the price on cheaper items (a RD$400 gap on a
// RD$3,000 blender still is). A RD$0-50 "comparison" is noise.
export function isWorthSharing(savings: number, bestPrice: number): boolean {
  if (!(savings > 0) || !(bestPrice > 0)) return false
  return savings >= 1_000 || (savings >= 300 && savings / bestPrice >= 0.1)
}

export function bestPrice(product: Product): number | undefined {
  const offer = getBestOffer(product.prices)
  return offer ? getOfferTotal(offer) : undefined
}

// Mirrors the /precios product types (apps/web-seo/src/lib/insights.ts),
// plus the hashtag each one uses on Instagram.
export interface ProductType {
  slug: string
  label: string
  hashtag: string
  keywords: string[]
  exclude?: string[]
  minPrice: number
  /** Grammatical gender: "los 5 televisores más baratos". */
  masculine?: boolean
}

export const PRODUCT_TYPES: ProductType[] = [
  { slug: 'neveras', label: 'neveras', hashtag: '#Neveras', keywords: ['nevera', 'refrigerador', 'refrigeradora', 'side by side'], exclude: ['base', 'filtro', 'kit', 'cubeta', 'bebida'], minPrice: 8_000 },
  { slug: 'lavadoras', label: 'lavadoras', hashtag: '#Lavadoras', keywords: ['lavadora'], exclude: ['kit', 'base', 'manguera', 'secadora'], minPrice: 7_000 },
  { slug: 'secadoras', label: 'secadoras', hashtag: '#Secadoras', keywords: ['secadora'], exclude: ['pelo', 'cabello', 'kit', 'lavadora', 'ducto'], minPrice: 7_000 },
  { slug: 'centros-de-lavado', label: 'centros de lavado', hashtag: '#Lavadoras', keywords: ['lavadora y secadora', 'lavadora secadora', 'centro de lavado', 'torre'], exclude: ['kit'], minPrice: 15_000, masculine: true },
  { slug: 'estufas', label: 'estufas', hashtag: '#Estufas', keywords: ['estufa', 'cocina a gas', 'cocina electrica'], exclude: ['butano', 'camping', 'parrilla', 'repuesto', 'quemador'], minPrice: 5_000 },
  { slug: 'aires-acondicionados', label: 'aires acondicionados', hashtag: '#AireAcondicionado', keywords: ['aire acondicionado', 'a/a', 'inverter', 'btu'], exclude: ['control', 'soporte', 'base', 'kit', 'purificador', 'deshumid'], minPrice: 10_000, masculine: true },
  { slug: 'televisores', label: 'televisores', hashtag: '#SmartTV', keywords: ['televisor', 'smart tv', ' tv ', 'pulgadas', 'qled', 'oled', 'uhd'], exclude: ['soporte', 'base', 'control', 'cable', 'bocina', 'barra'], minPrice: 6_000, masculine: true },
  { slug: 'microondas', label: 'microondas', hashtag: '#Microondas', keywords: ['microondas'], exclude: ['soporte', 'base', 'plato'], minPrice: 2_500, masculine: true },
  { slug: 'freidoras-de-aire', label: 'freidoras de aire', hashtag: '#AirFryer', keywords: ['freidora de aire', 'air fryer', 'freidora'], exclude: ['papel', 'molde', 'accesorio', 'canasta'], minPrice: 1_500 },
  { slug: 'abanicos', label: 'abanicos', hashtag: '#Abanicos', keywords: ['abanico', 'ventilador'], exclude: ['repuesto', 'aspa', 'cuello'], minPrice: 900, masculine: true },
  { slug: 'licuadoras', label: 'licuadoras', hashtag: '#Licuadoras', keywords: ['licuadora'], exclude: ['vaso', 'cuchilla', 'tapa', 'rosca', 'repuesto', 'jarra'], minPrice: 1_200 },
  { slug: 'lavaplatos', label: 'lavaplatos', hashtag: '#Lavaplatos', keywords: ['lavaplatos', 'lavavajillas'], minPrice: 10_000, masculine: true },
  { slug: 'congeladores', label: 'congeladores', hashtag: '#Congeladores', keywords: ['congelador', 'freezer'], exclude: ['nevera', 'refrigerador'], minPrice: 8_000, masculine: true },
]

function normalize(text: string): string {
  return ` ${text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()} `
}

export function matchesType(product: Product, type: ProductType): boolean {
  const name = normalize(product.name)
  if (!type.keywords.some(keyword => name.includes(normalize(keyword).trim()))) return false
  if (type.exclude?.some(word => name.includes(normalize(word).trim()))) return false
  const price = bestPrice(product)
  return price !== undefined && price >= type.minPrice
}

export function productType(product: Product): ProductType | undefined {
  return PRODUCT_TYPES.find(type => matchesType(product, type))
}

// Few, local and specific: Instagram now recommends 3-5 hashtags.
export function hashtags(product: Product | null): string {
  const specific = product ? productType(product)?.hashtag : undefined
  return ['#DóndeTa', '#OfertasRD', '#SantoDomingo', specific ?? '#Electrodomésticos', '#AhorroRD'].join(' ')
}

// A closing question invites comments, which is what Instagram rewards.
// Deterministic per product so a re-render gives the same caption.
const QUESTIONS = {
  comparison: [
    '¿Tú sabías que había tanta diferencia? 👇',
    '¿En cuál tienda lo habrías comprado tú? 👇',
    'Etiqueta a alguien que está buscando uno 👇',
    '¿Qué producto quieres que comparemos ahora? Déjalo en los comentarios 👇',
  ],
  drop: [
    '¿Lo estabas esperando? 👇',
    'Etiqueta a quien le hace falta uno 👇',
    '¿Qué otro producto quieres que vigilemos? 👇',
  ],
  top5: [
    '¿Cuál te llevarías tú? 👇',
    'Guárdalo para cuando vayas a comprar 📌',
    '¿Qué quieres que comparemos la próxima semana? 👇',
  ],
}

export function closingQuestion(kind: keyof typeof QUESTIONS, seed: string): string {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const list = QUESTIONS[kind]
  return list[hash % list.length]
}

// Weekly "Top 5" carousel: a different product type each week, the five
// cheapest in-stock models -- one per brand, so it's not five sizes of the
// same fridge.
export const WEEKLY_ROTATION = ['neveras', 'televisores', 'lavadoras', 'aires-acondicionados', 'estufas', 'freidoras-de-aire', 'secadoras', 'microondas']
export const TOP_SIZE = 5

// Weeks since 2026-01-05 (a Monday): changes every Monday, no locale rules.
export function weekIndex(date = new Date()): number {
  return Math.floor((date.getTime() - Date.UTC(2026, 0, 5)) / (7 * 86_400_000))
}

export function weeklyTop(products: Product[], week: number): { type: ProductType; items: Product[] } | null {
  for (let i = 0; i < WEEKLY_ROTATION.length; i++) {
    const slug = WEEKLY_ROTATION[(((week + i) % WEEKLY_ROTATION.length) + WEEKLY_ROTATION.length) % WEEKLY_ROTATION.length]
    const type = PRODUCT_TYPES.find(t => t.slug === slug)!
    const seenBrands = new Set<string>()
    const items = products
      .filter(p => p.prices.some(o => o.available) && matchesType(p, type))
      .sort((a, b) => (bestPrice(a) ?? Infinity) - (bestPrice(b) ?? Infinity))
      .filter(p => {
        const brand = p.brand.trim().toLowerCase()
        if (!brand || seenBrands.has(brand)) return !brand
        seenBrands.add(brand)
        return true
      })
      .slice(0, TOP_SIZE)
    if (items.length === TOP_SIZE) return { type, items }
  }
  return null
}

import type { Product } from '../types'
import { getBestOffer, getOfferTotal } from './offers'

// "Tipo de artículo" filter. Retailer categories are inconsistent (Neveras /
// Refrigeradores, Televisores / Televisión, Electro Cocina...), so the filter
// groups products by what they are, matched on the product name. The first
// 13 mirror PRODUCT_TYPES in apps/web-seo/src/lib/insights.ts -- keep them in
// sync so the filter and the /precios/<tipo> pages agree.
export interface ProductType {
  slug: string
  title: string
  keywords: string[]
  exclude?: string[] // accessories that mention the keyword ("base para nevera")
  minPrice: number // below this it's an accessory/part, not the appliance
}

export const PRODUCT_TYPES: ProductType[] = [
  { slug: 'neveras', title: 'Neveras y refrigeradores', keywords: ['nevera', 'refrigerador', 'refrigeradora', 'side by side'], exclude: ['base', 'filtro', 'kit', 'cubeta', 'bebida'], minPrice: 8_000 },
  { slug: 'lavadoras', title: 'Lavadoras', keywords: ['lavadora'], exclude: ['kit', 'base', 'manguera', 'secadora'], minPrice: 7_000 },
  { slug: 'secadoras', title: 'Secadoras de ropa', keywords: ['secadora'], exclude: ['pelo', 'cabello', 'kit', 'lavadora', 'ducto'], minPrice: 7_000 },
  { slug: 'centros-de-lavado', title: 'Centros de lavado', keywords: ['lavadora y secadora', 'lavadora secadora', 'lavadora/secadora', 'centro de lavado', 'torre'], exclude: ['kit'], minPrice: 15_000 },
  { slug: 'estufas', title: 'Estufas y cocinas', keywords: ['estufa', 'cocina a gas', 'cocina electrica'], exclude: ['butano', 'camping', 'parrilla', 'repuesto', 'quemador'], minPrice: 5_000 },
  { slug: 'aires-acondicionados', title: 'Aires acondicionados', keywords: ['aire acondicionado', 'a/a', 'inverter', 'btu'], exclude: ['control', 'soporte', 'base', 'kit', 'purificador', 'deshumidificador', 'deshumificador'], minPrice: 10_000 },
  { slug: 'microondas', title: 'Microondas', keywords: ['microondas', 'microonda'], exclude: ['soporte', 'base', 'plato'], minPrice: 2_500 },
  { slug: 'freidoras-de-aire', title: 'Freidoras de aire', keywords: ['freidora de aire', 'air fryer', 'freidora'], exclude: ['papel', 'molde', 'accesorio', 'canasta'], minPrice: 1_500 },
  { slug: 'abanicos', title: 'Abanicos y ventiladores', keywords: ['abanico', 'ventilador'], exclude: ['repuesto', 'cuello'], minPrice: 500 },
  { slug: 'licuadoras', title: 'Licuadoras', keywords: ['licuadora'], exclude: ['vaso', 'cuchilla', 'tapa', 'rosca', 'repuesto', 'jarra'], minPrice: 1_200 },
  { slug: 'lavaplatos', title: 'Lavaplatos', keywords: ['lavaplatos', 'lavavajillas'], minPrice: 10_000 },
  { slug: 'congeladores', title: 'Congeladores', keywords: ['congelador', 'freezer'], exclude: ['nevera', 'refrigerador'], minPrice: 8_000 },
  // Smaller groups the SEO pages don't have, so "Otros" stays small.
  { slug: 'bebederos', title: 'Bebederos y dispensadores', keywords: ['bebedero', 'dispensador de agua'], exclude: ['botellon', 'filtro'], minPrice: 1_500 },
  { slug: 'barras-de-sonido', title: 'Barras de sonido y audio', keywords: ['barra de sonido', 'barra sonido', 'soundbar', 'bocina', 'teatro en casa'], minPrice: 1_000 },
  { slug: 'batidoras', title: 'Batidoras y procesadores', keywords: ['batidora', 'batidor', 'procesador de alimentos', 'procesador', 'picadora', 'extractor de jugo', 'exprimidor'], minPrice: 500 },
  { slug: 'cafeteras', title: 'Cafeteras', keywords: ['cafetera', 'espresso', 'molino de cafe'], exclude: ['filtro', 'capsula'], minPrice: 500 },
  { slug: 'hornos', title: 'Hornos, tostadoras y sandwicheras', keywords: ['horno', 'tostadora', 'tostador', 'sandwichera', 'waflera', 'arepera', 'parrilla electrica', 'plancha de cocina', 'grill'], exclude: ['guante', 'bandeja', 'microondas'], minPrice: 500 },
  { slug: 'ollas', title: 'Ollas arroceras y de presión', keywords: ['arrocera', 'olla', 'multicooker', 'slow cooker'], minPrice: 500 },
  { slug: 'planchas', title: 'Planchas de ropa', keywords: ['plancha', 'vaporizador', 'tabla de planchar'], exclude: ['cabello', 'pelo', 'cocina'], minPrice: 300 },
  { slug: 'aspiradoras', title: 'Aspiradoras', keywords: ['aspiradora', 'robot aspirador', 'mopa', 'limpiador de vapor'], minPrice: 1_000 },
  { slug: 'extractores', title: 'Extractores de grasa', keywords: ['extractor de grasa', 'campana', 'extractor campana'], minPrice: 3_000 },
  { slug: 'cuidado-personal', title: 'Cuidado personal', keywords: ['secador de cabello', 'secadora de cabello', 'secador de pelo', 'plancha de cabello', 'plancha para cabello', 'rizador', 'afeitadora', 'recortadora', 'abejon', 'cortapelo'], minPrice: 300 },
  { slug: 'soportes-tv', title: 'Bases y soportes de TV', keywords: ['base para tv', 'base de tv', 'base tv', 'soporte para tv', 'soporte de tv', 'base de pared televisores', 'base para monitor', 'base dual'], minPrice: 300 },
  // Last: "pulgadas" also describes stoves, fans and dishwashers.
  { slug: 'televisores', title: 'Televisores', keywords: ['televisor', 'smart tv', ' tv ', 'pulgadas', 'qled', 'oled', 'uhd'], exclude: ['soporte', 'base', 'control', 'cable', 'bocina', 'barra', 'abanico', 'ventilador', 'extractor', 'campana', 'estufa', 'lavaplatos'], minPrice: 6_000 },
]

const TYPE_PREFIX = 'tipo:'

function normalize(text: string): string {
  return ` ${[...text.normalize('NFD')].filter(char => {
    const code = char.codePointAt(0) ?? 0
    return code < 0x300 || code > 0x36f
  }).join('').toLowerCase()} `
}

export function matchesType(product: Product, type: ProductType): boolean {
  const name = normalize(product.name)
  if (!type.keywords.some(keyword => name.includes(normalize(keyword).trim()))) return false
  // Whole words only: "kit" must not exclude KitchenAid, nor "quemador" every
  // stove "de 5 quemadores".
  const words = ` ${name.replace(/[^a-z0-9]+/g, ' ').trim()} `
  if (type.exclude?.some(word => words.includes(` ${normalize(word).trim()} `))) return false
  const offer = getBestOffer(product.prices)
  if (!offer) return false
  // Some retailers publish 0 for out-of-stock items: no price, no accessory test.
  const total = getOfferTotal(offer)
  return total <= 0 || total >= type.minPrice
}

export function typeFilterId(type: ProductType): string {
  return `${TYPE_PREFIX}${type.slug}`
}

// Filter id -> type, for ids produced by typeFilterId(); null for anything else
// (the curated CATEGORIES ids still go through matchesCategory).
export function typeFromFilterId(id: string): ProductType | null {
  if (!id.startsWith(TYPE_PREFIX)) return null
  return PRODUCT_TYPES.find(type => type.slug === id.slice(TYPE_PREFIX.length)) ?? null
}

// Types present in the catalog, with how many products each holds, plus an
// "Otros" bucket so nothing becomes unreachable through the filter.
export function availableTypes(products: Product[]): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>()
  let others = 0
  for (const product of products) {
    const type = PRODUCT_TYPES.find(t => matchesType(product, t))
    if (type) counts.set(type.slug, (counts.get(type.slug) ?? 0) + 1)
    else others++
  }
  const options = PRODUCT_TYPES
    .filter(type => counts.has(type.slug))
    .map(type => ({ id: typeFilterId(type), label: type.title, count: counts.get(type.slug)! }))
    .sort((a, b) => a.label.localeCompare(b.label))
  if (others > 0 && options.length > 0) options.push({ id: OTHER_TYPES_ID, label: 'Otros', count: others })
  return options
}

export const OTHER_TYPES_ID = `${TYPE_PREFIX}otros`

export function matchesTypeFilter(product: Product, id: string): boolean | null {
  if (id === OTHER_TYPES_ID) return !PRODUCT_TYPES.some(type => matchesType(product, type))
  const type = typeFromFilterId(id)
  if (!type) return null
  // Same first-match rule as availableTypes, so the counts add up.
  return PRODUCT_TYPES.find(t => matchesType(product, t)) === type
}

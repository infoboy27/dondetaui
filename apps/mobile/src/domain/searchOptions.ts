import type { Product } from '../types'
import { getBestOffer } from './offers'

// Sorting and filtering of search results, done on the device: /search
// already returns every match ranked by relevance. Pure (no RN) so it runs
// in the root vitest suite.

export type SortKey = 'relevance' | 'priceAsc' | 'priceDesc' | 'discount'

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Relevancia',
  priceAsc: 'Precio: menor a mayor',
  priceDesc: 'Precio: mayor a menor',
  discount: 'Mayor descuento',
}

export const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[]

export interface SearchFilters {
  stores: string[]
  categories: string[]
  brands: string[]
  minPrice: number | null
  maxPrice: number | null
  onlyAvailable: boolean
  onlyDeals: boolean
}

export const NO_FILTERS: SearchFilters = {
  stores: [],
  categories: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
  onlyAvailable: false,
  onlyDeals: false,
}

/** The price the card shows (best offer, in stock first); null when there is none. */
export function shownPrice(product: Product): number | null {
  const offer = getBestOffer(product.prices)
  return offer ? offer.price : null
}

function hasStock(product: Product): boolean {
  return product.prices.some(offer => offer.available)
}

function isDeal(product: Product): boolean {
  return product.discount > 0
}

export function activeFilterCount(filters: SearchFilters): number {
  return (
    filters.stores.length +
    filters.categories.length +
    filters.brands.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.onlyAvailable ? 1 : 0) +
    (filters.onlyDeals ? 1 : 0)
  )
}

export function filterProducts(products: Product[], filters: SearchFilters): Product[] {
  const stores = new Set(filters.stores)
  const categories = new Set(filters.categories)
  const brands = new Set(filters.brands)
  return products.filter(product => {
    if (stores.size && !product.prices.some(offer => stores.has(offer.store) && (!filters.onlyAvailable || offer.available))) return false
    if (categories.size && !categories.has(product.category)) return false
    if (brands.size && !brands.has(product.brand)) return false
    if (filters.onlyAvailable && !hasStock(product)) return false
    if (filters.onlyDeals && !isDeal(product)) return false
    if (filters.minPrice !== null || filters.maxPrice !== null) {
      const price = shownPrice(product)
      if (price === null) return false
      if (filters.minPrice !== null && price < filters.minPrice) return false
      if (filters.maxPrice !== null && price > filters.maxPrice) return false
    }
    return true
  })
}

/** Stable sort; products without a price always go last. `relevance` keeps the server order. */
export function sortProducts(products: Product[], sort: SortKey): Product[] {
  if (sort === 'relevance') return products
  const indexed = products.map((product, index) => ({ product, index, price: shownPrice(product) }))
  indexed.sort((a, b) => {
    if (sort === 'discount') {
      const byDiscount = b.product.discount - a.product.discount
      return byDiscount || a.index - b.index
    }
    if (a.price === null || b.price === null) {
      if (a.price === b.price) return a.index - b.index
      return a.price === null ? 1 : -1
    }
    const byPrice = sort === 'priceAsc' ? a.price - b.price : b.price - a.price
    return byPrice || a.index - b.index
  })
  return indexed.map(entry => entry.product)
}

export function applySearchOptions(products: Product[], sort: SortKey, filters: SearchFilters): Product[] {
  return sortProducts(filterProducts(products, filters), sort)
}

export interface Facet {
  value: string
  count: number
}

function countBy(values: string[][]): Facet[] {
  const counts = new Map<string, number>()
  for (const list of values) for (const value of new Set(list)) if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'es'))
}

/** Stores, categories and brands present in the results, most common first. */
export function searchFacets(products: Product[]): { stores: Facet[]; categories: Facet[]; brands: Facet[] } {
  return {
    stores: countBy(products.map(product => product.prices.map(offer => offer.store))),
    categories: countBy(products.map(product => [product.category])),
    brands: countBy(products.map(product => [product.brand])),
  }
}

/** Keeps only selections that still exist in the new results (a new query can drop a store). */
export function pruneFilters(filters: SearchFilters, products: Product[]): SearchFilters {
  const facets = searchFacets(products)
  const keep = (selected: string[], available: Facet[]) => {
    const values = new Set(available.map(facet => facet.value))
    return selected.filter(value => values.has(value))
  }
  return {
    ...filters,
    stores: keep(filters.stores, facets.stores),
    categories: keep(filters.categories, facets.categories),
    brands: keep(filters.brands, facets.brands),
  }
}

/** "25,000" / "25.000" / "RD$ 25000" -> 25000; empty or invalid -> null. */
export function parsePriceInput(text: string): number | null {
  const digits = text.replace(/[^0-9]/g, '')
  if (!digits) return null
  const value = Number(digits)
  return Number.isFinite(value) ? value : null
}

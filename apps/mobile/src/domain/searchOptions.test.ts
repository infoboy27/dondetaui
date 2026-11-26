import { describe, expect, it } from 'vitest'
import type { Product, StorePrice } from '../types'
import {
  NO_FILTERS,
  activeFilterCount,
  applySearchOptions,
  availableSortKeys,
  hasDeals,
  filterProducts,
  parsePriceInput,
  pruneFilters,
  searchFacets,
  shownPrice,
  sortProducts,
} from './searchOptions'

const offer = (store: string, price: number, available = true): StorePrice => ({
  store, abbr: store.slice(0, 2), color: '#000', price, shipping: 'Gratis', available, updated: '',
})

const product = (id: string, prices: StorePrice[], extra: Partial<Product> = {}): Product => ({
  id, name: id, brand: 'LG', model: '', subtitle: '', image: '', rating: 0, reviews: 0,
  category: 'Neveras', categoryId: 'c1', discount: 0, previousPrice: 0, prices, priceHistory: [], ...extra,
})

const fridge = product('fridge', [offer('Plaza Lama', 30000), offer('Sirena', 28000)], { discount: 10 })
const tv = product('tv', [offer('Sirena', 15000)], { brand: 'Samsung', category: 'Televisores' })
const fan = product('fan', [offer('Jumbo', 2500)], { brand: 'Mabe', category: 'Abanicos', discount: 25 })
const soldOut = product('soldout', [offer('Jumbo', 999, false)])
const noOffers = product('none', [])
const results = [fridge, tv, fan, soldOut, noOffers]
const ids = (list: Product[]) => list.map(p => p.id)

describe('shownPrice', () => {
  it('is the best in-stock price, the one the card shows', () => {
    expect(shownPrice(fridge)).toBe(28000)
  })
  it('falls back to an out-of-stock price, and null with no offers', () => {
    expect(shownPrice(soldOut)).toBe(999)
    expect(shownPrice(noOffers)).toBeNull()
  })
})

describe('sortProducts', () => {
  it('keeps the server order for relevance', () => {
    expect(ids(sortProducts(results, 'relevance'))).toEqual(ids(results))
  })
  it('sorts by price low to high, products without price last', () => {
    expect(ids(sortProducts(results, 'priceAsc'))).toEqual(['soldout', 'fan', 'tv', 'fridge', 'none'])
  })
  it('sorts by price high to low, products without price still last', () => {
    expect(ids(sortProducts(results, 'priceDesc'))).toEqual(['fridge', 'tv', 'fan', 'soldout', 'none'])
  })
  it('sorts by discount, ties keep relevance order', () => {
    expect(ids(sortProducts(results, 'discount'))).toEqual(['fan', 'fridge', 'tv', 'soldout', 'none'])
  })
  it('does not mutate its input', () => {
    const copy = [...results]
    sortProducts(results, 'priceAsc')
    expect(results).toEqual(copy)
  })
})

describe('filterProducts', () => {
  it('returns everything with no filters', () => {
    expect(filterProducts(results, NO_FILTERS)).toHaveLength(results.length)
  })
  it('filters by store (any of them)', () => {
    expect(ids(filterProducts(results, { ...NO_FILTERS, stores: ['Sirena'] }))).toEqual(['fridge', 'tv'])
    expect(ids(filterProducts(results, { ...NO_FILTERS, stores: ['Sirena', 'Jumbo'] }))).toEqual(['fridge', 'tv', 'fan', 'soldout'])
  })
  it('store + only available requires stock at that store', () => {
    expect(ids(filterProducts(results, { ...NO_FILTERS, stores: ['Jumbo'], onlyAvailable: true }))).toEqual(['fan'])
  })
  it('filters by category and brand', () => {
    expect(ids(filterProducts(results, { ...NO_FILTERS, categories: ['Televisores'] }))).toEqual(['tv'])
    expect(ids(filterProducts(results, { ...NO_FILTERS, brands: ['LG'] }))).toEqual(['fridge', 'soldout', 'none'])
  })
  it('filters by price range on the shown price, dropping products without price', () => {
    expect(ids(filterProducts(results, { ...NO_FILTERS, minPrice: 2000, maxPrice: 20000 }))).toEqual(['tv', 'fan'])
    expect(ids(filterProducts(results, { ...NO_FILTERS, maxPrice: 1000 }))).toEqual(['soldout'])
    expect(ids(filterProducts(results, { ...NO_FILTERS, minPrice: 28000 }))).toEqual(['fridge'])
  })
  it('only available and only deals', () => {
    expect(ids(filterProducts(results, { ...NO_FILTERS, onlyAvailable: true }))).toEqual(['fridge', 'tv', 'fan'])
    expect(ids(filterProducts(results, { ...NO_FILTERS, onlyDeals: true }))).toEqual(['fridge', 'fan'])
  })
})

describe('applySearchOptions', () => {
  it('filters then sorts', () => {
    expect(ids(applySearchOptions(results, 'priceAsc', { ...NO_FILTERS, onlyAvailable: true }))).toEqual(['fan', 'tv', 'fridge'])
  })
})

describe('activeFilterCount', () => {
  it('counts each selection, the price range once and each switch', () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0)
    expect(activeFilterCount({ ...NO_FILTERS, stores: ['a', 'b'], minPrice: 1, maxPrice: 5, onlyDeals: true })).toBe(4)
  })
})

describe('searchFacets', () => {
  it('counts each product once per store, most common first', () => {
    const facets = searchFacets(results)
    expect(facets.stores).toEqual([{ value: 'Jumbo', count: 2 }, { value: 'Sirena', count: 2 }, { value: 'Plaza Lama', count: 1 }])
    expect(facets.brands[0]).toEqual({ value: 'LG', count: 3 })
  })
})

describe('pruneFilters', () => {
  it('drops selections that are not in the new results', () => {
    const pruned = pruneFilters({ ...NO_FILTERS, stores: ['Sirena', 'Jumbo'], brands: ['Mabe'], onlyDeals: true }, [tv])
    expect(pruned).toEqual({ ...NO_FILTERS, stores: ['Sirena'], brands: [], onlyDeals: true })
  })
})

describe('parsePriceInput', () => {
  it('reads digits from what people type', () => {
    expect(parsePriceInput('25,000')).toBe(25000)
    expect(parsePriceInput('RD$ 1.500')).toBe(1500)
    expect(parsePriceInput('')).toBeNull()
    expect(parsePriceInput('abc')).toBeNull()
  })
})

describe('discount options', () => {
  it('offers the discount filter and sort only when some result has a discount', () => {
    expect(hasDeals(results)).toBe(true)
    expect(availableSortKeys(results)).toContain('discount')
    expect(hasDeals([tv, soldOut])).toBe(false)
    expect(availableSortKeys([tv, soldOut])).toEqual(['relevance', 'priceAsc', 'priceDesc'])
  })
})

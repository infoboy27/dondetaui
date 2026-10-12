import type { ProductDto } from './products.types'

export interface HighlightsDto {
  total: number
  stores: number
  products: ProductDto[]
  // Digital gaming products (Eneba): their own home section, outside the
  // price comparison.
  gaming: ProductDto[]
}

export const GAMING_CATEGORY = 'gaming'

export function isGaming(product: Pick<ProductDto, 'categoryId'>): boolean {
  return product.categoryId === GAMING_CATEGORY
}

// The home page only shows "Comparaciones del día" (sold in 2+ stores) and
// "Bajaron de precio" (the price history moved). Sending just those
// candidates instead of the whole catalog cut its payload ~80%; the client
// still ranks them with the same functions it used on the full list.
//
// Gaming stays out of both: it's sold by one store, and marketplace prices
// wobble every day, which would flood "Bajaron de precio". It's not counted
// in total/stores either -- those describe the appliance comparison.
export function homeHighlights(products: ProductDto[]): HighlightsDto {
  const compared = products.filter(product => !isGaming(product))
  const stores = new Set(compared.flatMap(product => product.prices.map(offer => offer.store)))
  return {
    total: compared.length,
    stores: stores.size,
    products: compared.filter(isCandidate),
    gaming: products.filter(isGaming),
  }
}

export function isCandidate(product: ProductDto): boolean {
  if (new Set(product.prices.map(offer => offer.store)).size >= 2) return true
  return new Set(product.priceHistory.map(point => point.price)).size > 1
}

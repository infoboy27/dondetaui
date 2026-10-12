import type { ProductDto } from './products.types'

export interface HighlightsDto {
  total: number
  stores: number
  products: ProductDto[]
}

// The home page only shows "Comparaciones del día" (sold in 2+ stores) and
// "Bajaron de precio" (the price history moved). Sending just those
// candidates instead of the whole catalog cut its payload ~80%; the client
// still ranks them with the same functions it used on the full list.
export function homeHighlights(products: ProductDto[]): HighlightsDto {
  const stores = new Set(products.flatMap(product => product.prices.map(offer => offer.store)))
  return {
    total: products.length,
    stores: stores.size,
    products: products.filter(isCandidate),
  }
}

export function isCandidate(product: ProductDto): boolean {
  if (new Set(product.prices.map(offer => offer.store)).size >= 2) return true
  return new Set(product.priceHistory.map(point => point.price)).size > 1
}

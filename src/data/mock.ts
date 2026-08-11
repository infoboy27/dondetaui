import type { Product } from '../types'

// Mirrors the 5 real retailers in the `retailers` table exactly — a fixture entry
// for a store that doesn't exist in the DB would let useStoreDetail's offline
// fallback (src/hooks/useStoreDetail.ts) resolve a "store" that isn't real.
export const STORES: Record<string, { color: string; abbr: string }> = {
  'Plaza Lama': { color: '#C0392B', abbr: 'PL' },
  'Sirena': { color: '#2980B9', abbr: 'SI' },
  'Corripio': { color: '#27AE60', abbr: 'CO' },
  'Jumbo': { color: '#E67E22', abbr: 'JU' },
  'PriceSmart': { color: '#8E44AD', abbr: 'PS' },
}

function seededUnit(seed: number): number {
  const value = Math.sin(seed) * 10000
  return value - Math.floor(value)
}

function makePriceHistory(basePrice: number, days = 90): { date: string; price: number }[] {
  const history: { date: string; price: number }[] = []
  let price = basePrice * 1.15
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const sequenceIndex = days - i
    const jitter = seededUnit(basePrice + sequenceIndex * 131 + days * 17) - 0.52
    price = price + jitter * (basePrice * 0.02)
    price = Math.max(basePrice * 0.92, Math.min(basePrice * 1.2, price))

    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price / 5) * 5,
    })
  }

  history[history.length - 1].price = basePrice
  return history
}

export const PRODUCTS: Product[] = [
  {
    id: 'samsung-wa18t6360bv',
    name: 'Samsung 18kg WA18T6360BV',
    brand: 'Samsung',
    model: 'WA18T6360BV',
    subtitle: 'Lavadora carga superior',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=600&fit=crop&auto=format',
    rating: 4.6,
    reviews: 128,
    category: 'Electrodomésticos',
    categoryId: 'electrodomesticos',
    discount: 14,
    previousPrice: 28995,
    prices: [
      { store: 'Plaza Lama', abbr: 'PL', color: '#C0392B', price: 24495, shipping: 'Gratis', available: true, updated: '20 min', distance: '1.2 km' },
      { store: 'Sirena', abbr: 'SI', color: '#2980B9', price: 24995, shipping: 'RD$500', available: true, updated: '1 hora', distance: '2.0 km' },
      { store: 'Corripio', abbr: 'CO', color: '#27AE60', price: 25695, shipping: 'Gratis', available: true, updated: '2 horas', distance: '3.5 km' },
      { store: 'Jumbo', abbr: 'JU', color: '#E67E22', price: 26395, shipping: 'RD$800', available: true, updated: '3 horas', distance: '4.1 km' },
      { store: 'PriceSmart', abbr: 'PS', color: '#8E44AD', price: 27495, shipping: 'Gratis', available: false, updated: '1 día', distance: '5.8 km' },
    ],
    priceHistory: makePriceHistory(24495),
    favorite: false,
    alerted: false,
  },
  {
    id: 'samsung-tv55-un55tu7000',
    name: 'TV Samsung 55" UN55TU7000',
    brand: 'Samsung',
    model: 'UN55TU7000',
    subtitle: 'Smart TV 4K UHD',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&h=600&fit=crop&auto=format',
    rating: 4.8,
    reviews: 256,
    category: 'TV y Audio',
    categoryId: 'tv-audio',
    discount: 18,
    previousPrice: 39995,
    prices: [
      { store: 'Jumbo', abbr: 'JU', color: '#E67E22', price: 32995, shipping: 'Gratis', available: true, updated: '45 min', distance: '4.1 km' },
      { store: 'Plaza Lama', abbr: 'PL', color: '#C0392B', price: 33495, shipping: 'Gratis', available: true, updated: '1 hora', distance: '1.2 km' },
      { store: 'Sirena', abbr: 'SI', color: '#2980B9', price: 34995, shipping: 'RD$500', available: true, updated: '2 horas', distance: '2.0 km' },
      { store: 'Corripio', abbr: 'CO', color: '#27AE60', price: 35995, shipping: 'Gratis', available: true, updated: '3 horas', distance: '3.5 km' },
    ],
    priceHistory: makePriceHistory(32995),
    favorite: true,
    alerted: false,
  },
  {
    id: 'lg-aire-12k-inverter',
    name: 'Aire LG Inverter 12,000 BTU',
    brand: 'LG',
    model: 'LW1216ER',
    subtitle: 'Aire acondicionado Inverter',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=600&fit=crop&auto=format',
    rating: 4.5,
    reviews: 94,
    category: 'Aires Acondicionados',
    categoryId: 'aires',
    discount: 9,
    previousPrice: 31995,
    prices: [
      { store: 'Corripio', abbr: 'CO', color: '#27AE60', price: 28995, shipping: 'Gratis', available: true, updated: '30 min', distance: '3.5 km' },
      { store: 'Plaza Lama', abbr: 'PL', color: '#C0392B', price: 29495, shipping: 'RD$500', available: true, updated: '1 hora', distance: '1.2 km' },
      { store: 'Jumbo', abbr: 'JU', color: '#E67E22', price: 30495, shipping: 'Gratis', available: true, updated: '2 horas', distance: '4.1 km' },
      { store: 'PriceSmart', abbr: 'PS', color: '#8E44AD', price: 31995, shipping: 'Gratis', available: true, updated: '1 día', distance: '5.8 km' },
    ],
    priceHistory: makePriceHistory(28995),
    favorite: false,
    alerted: true,
  },
  {
    id: 'ninja-af101-air-fryer',
    name: 'Air Fryer Ninja AF101',
    brand: 'Ninja',
    model: 'AF101',
    subtitle: 'Freidora de aire 4 cuartos',
    image: 'https://images.unsplash.com/photo-1584949091598-c31daaaa4aa9?w=600&h=600&fit=crop&auto=format',
    rating: 4.9,
    reviews: 412,
    category: 'Cocina',
    categoryId: 'cocina',
    discount: 22,
    previousPrice: 8995,
    prices: [
      { store: 'PriceSmart', abbr: 'PS', color: '#8E44AD', price: 6995, shipping: 'Gratis', available: true, updated: '15 min', distance: '5.8 km' },
      { store: 'Sirena', abbr: 'SI', color: '#2980B9', price: 7495, shipping: 'RD$300', available: true, updated: '1 hora', distance: '2.0 km' },
      { store: 'Corripio', abbr: 'CO', color: '#27AE60', price: 7995, shipping: 'Gratis', available: true, updated: '3 horas', distance: '3.5 km' },
      { store: 'Jumbo', abbr: 'JU', color: '#E67E22', price: 8495, shipping: 'RD$500', available: false, updated: '1 día', distance: '4.1 km' },
    ],
    priceHistory: makePriceHistory(6995),
    favorite: false,
    alerted: false,
  },
  {
    id: 'samsung-nevera-rf26hf',
    name: 'Nevera Samsung French Door 26 pies',
    brand: 'Samsung',
    model: 'RF26HF',
    subtitle: 'Refrigerador French Door',
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&h=600&fit=crop&auto=format',
    rating: 4.7,
    reviews: 87,
    category: 'Electrodomésticos',
    categoryId: 'electrodomesticos',
    discount: 12,
    previousPrice: 89995,
    prices: [
      { store: 'Plaza Lama', abbr: 'PL', color: '#C0392B', price: 78995, shipping: 'Gratis', available: true, updated: '1 hora', distance: '1.2 km' },
      { store: 'Corripio', abbr: 'CO', color: '#27AE60', price: 79995, shipping: 'Gratis', available: true, updated: '2 horas', distance: '3.5 km' },
      { store: 'Jumbo', abbr: 'JU', color: '#E67E22', price: 82995, shipping: 'RD$1,000', available: true, updated: '3 horas', distance: '4.1 km' },
    ],
    priceHistory: makePriceHistory(78995),
    favorite: false,
    alerted: false,
  },
]

export const CATEGORIES = [
  { id: 'electrodomesticos', label: 'Electrodomésticos', emoji: '🏠', color: '#E6F7F3', border: '#00B894' },
  { id: 'hogar', label: 'Hogar', emoji: '🛋️', color: '#FFF3E0', border: '#FF9F1C' },
  { id: 'tv-audio', label: 'TV y Audio', emoji: '📺', color: '#EEF2FF', border: '#6366F1' },
  { id: 'muebles', label: 'Muebles', emoji: '🪑', color: '#FEF3C7', border: '#F59E0B' },
  { id: 'aires', label: 'Aires A/C', emoji: '❄️', color: '#E0F2FE', border: '#0EA5E9' },
  { id: 'cocina', label: 'Cocina', emoji: '🍳', color: '#FFF0F0', border: '#EF4444' },
]

export const RECENT_SEARCHES = [
  'Lavadora Samsung',
  'Nevera 18 pies',
  'TV Samsung 55',
  'Aire 12,000 BTU',
  'Air Fryer Ninja',
]

export const TRENDING = [
  'Lavadora Samsung 18kg',
  'TV 55" 4K Smart',
  'Aire Inverter 12k BTU',
  'Air Fryer Ninja AF101',
  'Nevera French Door 26 pies',
]

export const formatPrice = (price: number): string =>
  `RD$${price.toLocaleString('es-DO')}`

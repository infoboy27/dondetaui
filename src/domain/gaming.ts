import type { Product } from '../types'

// Gaming = Eneba's digital products (apps/api/src/ingestion/eneba.catalog.ts):
// top-ups, subscriptions and PC game keys. One store, delivered by email, so
// it gets its own section instead of the price-comparison strips.
export const GAMING_CATEGORY = 'gaming'

// Eneba affiliate discount code: 5% off games, gift cards, game points, DLC
// and subscriptions.
export const ENEBA_DISCOUNT_CODE = 'dondeta'

export function isGaming(product: Pick<Product, 'categoryId'>): boolean {
  return product.categoryId === GAMING_CATEGORY
}

export type GamingKind = 'Recarga' | 'Suscripción' | 'Juego PC'

export function gamingKind(product: Pick<Product, 'name'>): GamingKind {
  if (/game pass/i.test(product.name)) return 'Suscripción'
  // Games are named "<title> (PC, <launcher>)"; points packs end in "(PC)".
  if (/\(PC, /.test(product.name)) return 'Juego PC'
  return 'Recarga'
}

// What leads the home strip: the top-ups people here buy most, one size each,
// then games cheapest first. Names come from eneba.catalog.ts.
const SHOWCASE = [
  'Free Fire 100 ', 'Roblox 800 ', 'Fortnite 1000 ', 'Valorant 475 ', 'Xbox Game Pass',
  'Mobile Legends 278 ', 'Marvel Rivals 500 ', 'EA SPORTS FC 26 1050 ', 'Minecraft 1720 ', 'League of Legends 575 ',
]

const plain = (name: string) => name.replace(/(\d)[.,](\d{3})/g, '$1$2')

export function gamingShowcase(products: Product[], limit = 12): Product[] {
  const gaming = products.filter(isGaming)
  const lead = SHOWCASE
    .map(prefix => gaming.find(product => plain(product.name).startsWith(prefix)))
    .filter((product): product is Product => Boolean(product))
  const games = gaming
    .filter(product => gamingKind(product) === 'Juego PC')
    .sort((a, b) => lowestPrice(a) - lowestPrice(b))
  return [...lead, ...games].slice(0, limit)
}

function lowestPrice(product: Product): number {
  return Math.min(...product.prices.map(offer => offer.price))
}

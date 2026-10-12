import type { Product } from '../types'

// Mirrors the web app's src/domain/gaming.ts -- keep both in sync.
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

// Eneba drops a size from its feed now and then (eneba.cli marks it out of
// stock): it stays reachable, but never leads the strip or the section.
function inStock(product: Pick<Product, 'prices'>): boolean {
  return product.prices.some(offer => offer.available)
}

export function gamingShowcase(products: Product[], limit = 12): Product[] {
  const gaming = products.filter(product => isGaming(product) && inStock(product))
  const lead = SHOWCASE
    .map(prefix => gaming.find(product => plain(product.name).startsWith(prefix)))
    .filter((product): product is Product => Boolean(product))
  const games = gaming
    .filter(product => gamingKind(product) === 'Juego PC')
    .sort((a, b) => lowestPrice(a) - lowestPrice(b))
  return [...lead, ...games].slice(0, limit)
}

function lowestPrice(product: Pick<Product, 'prices'>): number {
  return Math.min(...product.prices.map(offer => offer.price))
}

const KIND_ORDER: Record<GamingKind, number> = { Recarga: 0, 'Suscripción': 1, 'Juego PC': 2 }

// Listing order for Gaming (the "relevance" of a single-store catalog): the
// showcase top-ups first, then top-ups, subscription, games, cheapest first.
// Without it, relevance falls back to "dearest first" and the page opened
// with a RD$13,000 diamond pack.
export function compareGaming(a: Pick<Product, 'name' | 'prices'>, b: Pick<Product, 'name' | 'prices'>): number {
  const lead = (p: Pick<Product, 'name'>) => {
    const index = SHOWCASE.findIndex(prefix => plain(p.name).startsWith(prefix))
    return index < 0 ? SHOWCASE.length : index
  }
  return Number(inStock(b)) - Number(inStock(a))
    || lead(a) - lead(b)
    || KIND_ORDER[gamingKind(a)] - KIND_ORDER[gamingKind(b)]
    || lowestPrice(a) - lowestPrice(b)
}

// Quick filters of the Gaming section (web: src/domain/sections.ts).
export const GAMING_FILTERS: { kind: GamingKind; label: string }[] = [
  { kind: 'Recarga', label: 'Recargas' },
  { kind: 'Suscripción', label: 'Suscripciones' },
  { kind: 'Juego PC', label: 'Juegos PC' },
]

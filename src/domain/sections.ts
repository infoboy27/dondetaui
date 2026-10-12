import type { Product } from '../types'
import { GAMING_CATEGORY, gamingKind, type GamingKind } from './gaming'
import { OTHER_TYPES_ID, availableTypes, matchesTypeFilter } from './productTypes'

// Quick filters at the top of a category page ("Neveras | Lavadoras | ..."
// or, in Gaming, "Recargas | Suscripciones | Juegos PC"). Built from the
// products actually in the section, so a chip never leads to zero results.
export interface SectionFilter {
  id: string
  label: string
  count: number
}

const KIND_PREFIX = 'kind:'
const GAMING_FILTERS: { kind: GamingKind; label: string }[] = [
  { kind: 'Recarga', label: 'Recargas' },
  { kind: 'Suscripción', label: 'Suscripciones' },
  { kind: 'Juego PC', label: 'Juegos PC' },
]

export function sectionFilters(category: string, products: Product[], limit = 8): SectionFilter[] {
  if (category === GAMING_CATEGORY) {
    return GAMING_FILTERS
      .map(({ kind, label }) => ({ id: `${KIND_PREFIX}${kind}`, label, count: products.filter(p => gamingKind(p) === kind).length }))
      .filter(filter => filter.count > 0)
  }
  return availableTypes(products)
    .filter(type => type.id !== OTHER_TYPES_ID && type.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function matchesSectionFilter(product: Product, id: string | null): boolean {
  if (!id) return true
  if (id.startsWith(KIND_PREFIX)) return gamingKind(product) === id.slice(KIND_PREFIX.length)
  return matchesTypeFilter(product, id) === true
}

export const SECTION_SUBTITLES: Record<string, string> = {
  [GAMING_CATEGORY]: 'Recargas, suscripciones y juegos digitales · Entrega inmediata',
}

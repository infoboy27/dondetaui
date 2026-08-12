import type { Product } from './types'

// Mirrors src/domain/categories.ts's CATEGORY_KEYWORDS/matchesCategory --
// duplicated rather than imported since apps/web-seo has no workspace
// link to the root app (same reason offers.ts/tokens.ts are duplicated
// here). Keep both in sync if the curated taxonomy changes.
//
// Hogar and Muebles are deliberately excluded here (unlike the full list
// in the main app's src/data/mock.ts): DóndeTa doesn't ingest anything in
// those departments, so an SSR page for them would always show zero
// products -- thin/empty content is actively bad for SEO, not neutral.
export const SEO_CATEGORIES: { id: string; label: string }[] = [
  { id: 'electrodomesticos', label: 'Electrodomésticos' },
  { id: 'aires', label: 'Aires Acondicionados' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'tv-audio', label: 'TV y Audio' },
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electrodomesticos: ['electrodomest', 'linea blanca', 'nevera', 'refriger', 'congelad', 'freezer', 'lavador', 'lavaplat', 'secador', 'lavad', 'plancha', 'aspirad', 'dispensador'],
  aires: ['acondicionad', 'climatiz', 'abanico', 'ventilad'],
  cocina: ['estufa', 'horno', 'microond', 'cocina', 'cocc', 'licuad', 'batidor', 'cafeter', 'tostad', 'freidora', 'air fryer'],
  'tv-audio': ['television', 'televisor', 'tv y audio', 'audio'],
}

export function matchesCategory(product: Product, selectedCategory: string): boolean {
  if (product.categoryId === selectedCategory) return true
  const keywords = CATEGORY_KEYWORDS[selectedCategory]
  if (!keywords?.length) return false
  const haystack = `${product.categoryId} ${product.category}`.toLowerCase()
  return keywords.some(keyword => haystack.includes(keyword))
}

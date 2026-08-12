import type { Product } from '../types'

// The "Categorías" quick-filters (Home screen buttons, DesktopView's
// Categorías page) are a fixed, hand-picked taxonomy -- real ingested
// products carry much more granular, retailer-derived category names
// (Abanicos, Aires Acondicionados, Estufas, Neveras, Televisores...) that
// rarely match those curated ids by exact string equality. Keyword lists
// (reusing the same appliance vocabulary already vetted for the ingestion
// safety net in apps/api/src/ingestion/ingestion.repository.ts) let a
// curated bucket match the real category data instead of returning
// empty/wrong results. Hogar and Muebles have no keywords: DóndeTa doesn't
// currently ingest anything in those departments, so they correctly show
// no results rather than mismatched ones.
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
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

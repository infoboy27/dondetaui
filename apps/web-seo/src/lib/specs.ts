import { bestPrice, matchesType, PRODUCT_TYPES } from './insights'
import type { Product } from './types'

// Spec comparison. Values are the retailers' own labels ("Resolución": "4K"),
// not measurements of ours: the page says so and never scores quality.

export const MAX_COMPARE = 3

export interface SpecRow {
  label: string
  values: Array<string | null> // one per compared product, null when unknown
  differs: boolean // values are known for 2+ products and not all equal
}

const norm = (value: string) => value.trim().toLowerCase()

export function specCount(product: Product): number {
  return Object.keys(product.specs ?? {}).length
}

// Rows ordered by how many of the compared products have a value, so the table
// opens with what can actually be compared; specs only one product has come last.
export function buildSpecRows(products: Product[]): SpecRow[] {
  const labels = new Map<string, number>()
  for (const product of products) {
    for (const label of Object.keys(product.specs ?? {})) labels.set(label, (labels.get(label) ?? 0) + 1)
  }
  return [...labels.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .map(([label]) => {
      const values = products.map(product => product.specs?.[label] ?? null)
      const known = values.filter((v): v is string => v !== null)
      return { label, values, differs: known.length > 1 && new Set(known.map(norm)).size > 1 }
    })
}

// Products of the same kind (TV with TV) that already have specs, nearest in
// price first, so the suggested comparison is between real alternatives.
export function similarProducts(product: Product, catalog: Product[], limit = MAX_COMPARE - 1): Product[] {
  const type = PRODUCT_TYPES.find(t => matchesType(product, t))
  if (!type || !specCount(product)) return []
  const price = bestPrice(product)
  return catalog
    .filter(other => other.id !== product.id && specCount(other) > 0 && matchesType(other, type) && bestPrice(other) !== undefined)
    .sort((a, b) => Math.abs((bestPrice(a) ?? 0) - (price ?? 0)) - Math.abs((bestPrice(b) ?? 0) - (price ?? 0)))
    .slice(0, limit)
}

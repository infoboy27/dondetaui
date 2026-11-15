import { compareByRelevance } from './offers'
import type { StorePrice } from '../types'

// Mirrors apps/api/src/products/search-ranking.ts (the API sorts /search the
// same way; the web re-sorts results client-side, so it needs the same
// tiers). Keep both in sync.
//
// The API matches a query on name, brand, model or category name, so
// "neveras" returns the whole Neveras category. Products whose name holds
// the query word come first: "Nevera Samsung" above "Bebedero Tecnomaster".

function normalize(text: string): string {
  return [...text.normalize('NFD')]
    .filter(char => {
      const code = char.codePointAt(0) ?? 0
      return code < 0x300 || code > 0x36f
    })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// "neveras" -> "nevera", "televisores" -> "televisor", "aires" -> "aire".
export function singularStem(word: string): string {
  if (word.length > 5 && /(or|on)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

// 0: the name starts with the query; 1: a name word starts with the query;
// 2: the name contains it somewhere; 3: matched only on brand/model/category.
export function searchRank(name: string, query: string): number {
  const words = normalize(query).split(' ').filter(Boolean)
  if (!words.length) return 3
  const stems = words.map(singularStem)
  const nameWords = normalize(name).split(' ').filter(Boolean)
  const startsWithAt = (index: number) => stems.every((stem, i) => nameWords[index + i]?.startsWith(stem))

  if (startsWithAt(0)) return 0
  if (nameWords.some((_, index) => startsWithAt(index))) return 1
  const joined = nameWords.join(' ')
  if (stems.every(stem => joined.includes(stem))) return 2
  return 3
}

// "Relevancia" order: for a search, the name-match tier first, then the
// usual listing relevance (store count, savings, price) within a tier.
export function sortBySearchRelevance<T extends { name: string; prices: StorePrice[]; categoryId?: string }>(
  products: T[],
  query: string,
): T[] {
  if (!query.trim()) return [...products].sort(compareByRelevance)
  const ranks = new Map(products.map(product => [product, searchRank(product.name, query)]))
  return [...products].sort((a, b) => (ranks.get(a) ?? 3) - (ranks.get(b) ?? 3) || compareByRelevance(a, b))
}

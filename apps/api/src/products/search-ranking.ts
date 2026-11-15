// Search relevance. The SQL match is broad (name, brand, model or category
// name), so a category-ish query like "neveras" returns the whole Neveras
// category -- and alphabetical order put "Bebedero ..." above every
// "Nevera ...". Rank by where the query word appears in the product name,
// keeping alphabetical order within each tier.

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// "neveras" -> "nevera", "televisores" -> "televisor", "aires" -> "aire";
// "microondas" -> "microonda" is still a prefix of itself. Name words are
// prefix-matched against the stem, so plural and singular both hit.
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

// Stable: the incoming order (alphabetical from SQL) is kept within a tier.
export function rankSearchResults<T extends { name: string }>(products: T[], query: string): T[] {
  if (!query.trim()) return products
  return products
    .map((product, index) => ({ product, index, rank: searchRank(product.name, query) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(entry => entry.product)
}

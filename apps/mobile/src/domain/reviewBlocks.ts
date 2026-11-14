// "Ocultar reseñas de este usuario": a reader hides an author's reviews.
// Signed in, the list lives on the server (/api/me/blocked-authors); signed
// out, on this phone. Copy of src/domain/reviewBlocks.ts (the web) --
// keep both in sync.

export interface AuthorKeyed {
  authorKey?: string
}

export function withoutBlocked<T extends AuthorKeyed>(reviews: T[], blocked: ReadonlySet<string>): T[] {
  if (blocked.size === 0) return reviews
  return reviews.filter(review => !review.authorKey || !blocked.has(review.authorKey))
}

const KEY_PATTERN = /^[0-9a-f]{16}$/

// Parses what was saved locally; anything malformed is dropped.
export function parseBlocked(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string' && KEY_PATTERN.test(key)).slice(0, 500) : []
  } catch {
    return []
  }
}

export function addBlocked(current: string[], authorKey: string): string[] {
  if (!KEY_PATTERN.test(authorKey) || current.includes(authorKey)) return current
  return [...current, authorKey]
}

export const REPORT_OPTIONS = [
  { reason: 'offensive', label: 'Ofensiva o con insultos' },
  { reason: 'spam', label: 'Spam o publicidad' },
  { reason: 'false', label: 'Falsa o engañosa' },
  { reason: 'other', label: 'Otro motivo' },
] as const

export type ReportReason = (typeof REPORT_OPTIONS)[number]['reason']

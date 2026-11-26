// Validation for POST /me/saved-searches. Pure (no Nest), tested in the root suite.

export const MAX_SAVED_SEARCHES = 20
export const MIN_QUERY_LENGTH = 2
export const MAX_QUERY_LENGTH = 100
const MAX_PRICE_LIMIT = 1_000_000_000

export interface SavedSearchInput {
  query: string
  maxPrice: number | null
}

export type SavedSearchInputResult = { ok: true; value: SavedSearchInput } | { ok: false; error: string }

/** Trimmed, single-spaced and lower-cased: "Neveras " and "neveras" are the same saved search. */
export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function parseSavedSearchInput(body: unknown): SavedSearchInputResult {
  const raw = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  if (typeof raw.query !== 'string') return { ok: false, error: 'Escribe qué quieres buscar.' }
  const query = normalizeQuery(raw.query)
  if (query.length < MIN_QUERY_LENGTH) return { ok: false, error: 'Escribe al menos 2 letras.' }
  if (query.length > MAX_QUERY_LENGTH) return { ok: false, error: 'La búsqueda es demasiado larga.' }

  let maxPrice: number | null = null
  if (raw.maxPrice !== undefined && raw.maxPrice !== null) {
    if (typeof raw.maxPrice !== 'number' || !Number.isFinite(raw.maxPrice) || raw.maxPrice <= 0 || raw.maxPrice >= MAX_PRICE_LIMIT) {
      return { ok: false, error: 'El precio máximo no es válido.' }
    }
    maxPrice = Math.round(raw.maxPrice * 100) / 100
  }
  return { ok: true, value: { query, maxPrice } }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

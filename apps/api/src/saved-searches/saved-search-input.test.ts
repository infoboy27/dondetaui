import { describe, expect, it } from 'vitest'
import { isUuid, normalizeQuery, parseSavedSearchInput } from './saved-search-input'

describe('parseSavedSearchInput', () => {
  it('normalizes the query and keeps an optional max price', () => {
    expect(parseSavedSearchInput({ query: '  Nevera   Samsung ', maxPrice: 25000 })).toEqual({ ok: true, value: { query: 'nevera samsung', maxPrice: 25000 } })
    expect(parseSavedSearchInput({ query: 'tv' })).toEqual({ ok: true, value: { query: 'tv', maxPrice: null } })
    expect(parseSavedSearchInput({ query: 'tv', maxPrice: null })).toEqual({ ok: true, value: { query: 'tv', maxPrice: null } })
  })

  it('rounds the max price to cents', () => {
    expect(parseSavedSearchInput({ query: 'tv', maxPrice: 999.999 })).toEqual({ ok: true, value: { query: 'tv', maxPrice: 1000 } })
  })

  it('rejects missing, too short or too long queries', () => {
    expect(parseSavedSearchInput(null).ok).toBe(false)
    expect(parseSavedSearchInput({ query: 5 }).ok).toBe(false)
    expect(parseSavedSearchInput({ query: ' a ' }).ok).toBe(false)
    expect(parseSavedSearchInput({ query: 'x'.repeat(101) }).ok).toBe(false)
  })

  it('rejects a max price that is not a positive number', () => {
    for (const maxPrice of [0, -5, '100', Number.NaN, Number.POSITIVE_INFINITY, 2e9]) {
      expect(parseSavedSearchInput({ query: 'tv', maxPrice }).ok).toBe(false)
    }
  })
})

describe('helpers', () => {
  it('normalizeQuery collapses spaces and lower-cases', () => {
    expect(normalizeQuery(' Aire  Acondicionado ')).toBe('aire acondicionado')
  })

  it('isUuid', () => {
    expect(isUuid('6f1c2b3a-1d2e-4f5a-8b9c-0d1e2f3a4b5c')).toBe(true)
    expect(isUuid('1; drop table')).toBe(false)
    expect(isUuid(undefined)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { canSaveSearch, describeMaxPrice, parseMaxPrice } from './savedSearches'

describe('parseMaxPrice', () => {
  it('treats an empty field as no limit', () => {
    expect(parseMaxPrice('')).toEqual({ ok: true, value: null })
    expect(parseMaxPrice('   ')).toEqual({ ok: true, value: null })
  })

  it('ignores separators and the currency symbol', () => {
    expect(parseMaxPrice('RD$25,000')).toEqual({ ok: true, value: 25000 })
    expect(parseMaxPrice('25 000')).toEqual({ ok: true, value: 25000 })
  })

  it('rejects text without digits, zero, or absurd amounts', () => {
    expect(parseMaxPrice('barato').ok).toBe(false)
    expect(parseMaxPrice('0').ok).toBe(false)
    expect(parseMaxPrice('9999999999').ok).toBe(false)
  })
})

describe('saved search helpers', () => {
  it('needs at least 2 characters to save', () => {
    expect(canSaveSearch(' tv ')).toBe(true)
    expect(canSaveSearch(' a ')).toBe(false)
  })

  it('describes the max price', () => {
    expect(describeMaxPrice(null)).toBe('Cualquier precio')
    expect(describeMaxPrice(25000)).toMatch(/^Hasta .*25.000$/)
  })
})

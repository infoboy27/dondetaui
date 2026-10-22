import { describe, expect, it } from 'vitest'
import { isThinProduct } from './history'

const day = (n: number) => `2026-10-${String(n).padStart(2, '0')}`
const flat = (days: number) => Array.from({ length: days }, (_, i) => ({ date: day(i + 1), price: 10_000 }))
const moving = (days: number) => Array.from({ length: days }, (_, i) => ({ date: day(i + 1), price: i < days / 2 ? 10_000 : 9_000 }))

describe('isThinProduct', () => {
  it('keeps multi-store comparisons indexable and drops products with no offers', () => {
    expect(isThinProduct(2, [])).toBe(false)
    expect(isThinProduct(0, moving(20))).toBe(true)
  })

  it('treats a single store with a flat price as thin however long the history', () => {
    expect(isThinProduct(1, flat(20))).toBe(true)
  })

  it('treats a single store with real movement but under two weeks of data as thin', () => {
    expect(isThinProduct(1, moving(10))).toBe(true)
  })

  it('indexes a single store once there are 5+ observations over 14+ days with a price change', () => {
    expect(isThinProduct(1, moving(20))).toBe(false)
  })
})

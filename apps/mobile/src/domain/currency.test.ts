import { describe, expect, it } from 'vitest'
import { formatPrice } from './currency'

describe('formatPrice (app)', () => {
  it('formats whole pesos with thousands separators', () => {
    expect(formatPrice(24495)).toBe('RD$24,495')
  })

  it('rounds converted prices to the nearest peso', () => {
    expect(formatPrice(555.72)).toBe('RD$556')
    expect(formatPrice(39994.49)).toBe('RD$39,994')
  })
})

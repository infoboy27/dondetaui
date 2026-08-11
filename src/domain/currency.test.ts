import { describe, expect, it } from 'vitest'
import { formatPrice } from './currency'

describe('formatPrice', () => {
  it('prefixes the amount with the Dominican peso symbol', () => {
    expect(formatPrice(1000)).toBe('RD$1,000')
  })

  it('groups thousands using es-DO locale formatting', () => {
    expect(formatPrice(1234567)).toBe('RD$1,234,567')
  })

  it('formats zero without a sign', () => {
    expect(formatPrice(0)).toBe('RD$0')
  })
})

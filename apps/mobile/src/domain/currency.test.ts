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

describe('formatPrice per country', () => {
  it('uses the country currency, and keeps cents only where shelf prices have them', async () => {
    const { setCurrentCountry } = await import('./currentCountry')
    setCurrentCountry('US')
    expect(formatPrice(19.99)).toBe('US$19.99')
    expect(formatPrice(1299)).toBe('US$1,299')
    setCurrentCountry('MX')
    expect(formatPrice(5499.5)).toBe('$5,500')
    setCurrentCountry('DO')
    expect(formatPrice(24495)).toBe('RD$24,495')
  })
})

import { describe, expect, it } from 'vitest'
import { COUNTRIES, countryFromRegion, isCountryCode } from './countries'

describe('countryFromRegion', () => {
  it('maps the device region to a supported country, ignoring case', () => {
    expect(countryFromRegion('MX')).toBe('MX')
    expect(countryFromRegion('co')).toBe('CO')
    expect(countryFromRegion('DO')).toBe('DO')
    expect(countryFromRegion('US')).toBe('US')
  })

  it('returns null for regions we do not serve or no region', () => {
    expect(countryFromRegion('AR')).toBeNull()
    expect(countryFromRegion('')).toBeNull()
    expect(countryFromRegion(undefined)).toBeNull()
  })

  it('gives every country its own backend', () => {
    const urls = Object.values(COUNTRIES).map(c => c.apiUrl)
    expect(new Set(urls).size).toBe(urls.length)
    expect(isCountryCode('XX')).toBe(false)
  })
})

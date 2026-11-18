import { describe, expect, it } from 'vitest'
import { COUNTRIES, COUNTRY_LIST, countryFromRegion, isCountryCode, isLiveCountry } from './countries'

describe('countryFromRegion', () => {
  it('maps the device region to a supported country, ignoring case', () => {
    expect(countryFromRegion('MX')).toBe('MX')
    expect(countryFromRegion('co')).toBe('CO')
    expect(countryFromRegion('DO')).toBe('DO')
  })

  it('returns null for regions we do not serve or no region', () => {
    expect(countryFromRegion('AR')).toBeNull()
    expect(countryFromRegion('')).toBeNull()
    expect(countryFromRegion(undefined)).toBeNull()
  })

  it('never picks or offers a country that is not live yet', () => {
    // App Store review runs on US devices: they must not land on a closed backend.
    expect(countryFromRegion('US')).toBeNull()
    expect(isLiveCountry('US')).toBe(false)
    expect(COUNTRY_LIST.map(c => c.code)).toEqual(['DO', 'CO', 'MX'])
  })

  it('gives every country its own backend', () => {
    const urls = Object.values(COUNTRIES).map(c => c.apiUrl)
    expect(new Set(urls).size).toBe(urls.length)
    expect(isCountryCode('XX')).toBe(false)
  })
})

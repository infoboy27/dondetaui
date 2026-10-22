import { describe, expect, it } from 'vitest'
import { countryForHost, countryForLanguage } from './countries'

describe('countryForHost', () => {
  it('maps each deployment host to its country', () => {
    expect(countryForHost('dondeta.com.do').code).toBe('DO')
    expect(countryForHost('co.dondeta.com.do').code).toBe('CO')
    expect(countryForHost('MX.dondeta.com.do').code).toBe('MX')
    expect(countryForHost('dondeta.co').code).toBe('CO')
  })

  it('falls back to the Dominican Republic for unknown hosts', () => {
    expect(countryForHost('localhost').code).toBe('DO')
  })
})

describe('countryForLanguage', () => {
  it('suggests a live country from the browser language region', () => {
    expect(countryForLanguage('es-MX')?.code).toBe('MX')
    expect(countryForLanguage('es_CO')?.code).toBe('CO')
  })

  it('does not suggest countries that are not live or unknown regions', () => {
    expect(countryForLanguage('en-US')).toBeNull()
    expect(countryForLanguage('es-AR')).toBeNull()
    expect(countryForLanguage('es')).toBeNull()
    expect(countryForLanguage(undefined)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import {
  buildCountry, categoryDescription, countryShortName, currencyCode, hasGuides, homeDescription, homeTitle,
  htmlLang, isIndexable, productDescription, storeDescription, timeZone,
} from './country'

describe('buildCountry', () => {
  it('defaults to the Dominican Republic', () => {
    expect(buildCountry({})).toEqual({ code: 'DO', name: 'República Dominicana', adjective: 'dominicanas', isDominican: true })
  })
  it('reads env overrides', () => {
    const c = buildCountry({ COUNTRY_CODE: 'co', COUNTRY_NAME: 'Colombia', COUNTRY_ADJECTIVE: 'colombianas' })
    expect(c).toEqual({ code: 'CO', name: 'Colombia', adjective: 'colombianas', isDominican: false })
  })
  it('falls back to DO on an unknown code', () => {
    expect(buildCountry({ COUNTRY_CODE: 'XX' }).code).toBe('DO')
  })
})

describe('DR output is unchanged', () => {
  const dr = buildCountry({})
  it('home copy', () => {
    expect(homeTitle(dr)).toBe('DóndeTa — precios e historial de electrodomésticos en República Dominicana')
    expect(homeDescription(dr)).toBe(
      'DóndeTa registra los precios publicados de electrodomésticos, aires, neveras, lavadoras y televisores en tiendas dominicanas y muestra su historial para darte contexto antes de comprar.',
    )
  })
  it('category/store/product copy', () => {
    expect(categoryDescription(dr, 'Neveras', 4)).toBe('Precios publicados e historial de neveras en tiendas de República Dominicana. 4 productos monitoreados en DóndeTa.')
    expect(storeDescription(dr, 'Jumbo', 9)).toBe('Compara los precios de 9 productos en Jumbo contra otras tiendas de República Dominicana.')
    expect(productDescription(dr, 'X', { price: 'RD$1', store: 'S' }, 2)).toBe('Compara el precio de X entre 2 tiendas en República Dominicana. Precio más bajo: RD$1 en S. Historial de precios y enlaces para verificar.')
    expect(productDescription(dr, 'X', { price: 'RD$1', store: 'S' }, 1)).toBe('X en S: RD$1. Historial de precios publicados, ficha básica y enlace para verificar en la tienda. República Dominicana.')
    expect(productDescription(dr, 'X', undefined, 0)).toBe('Ficha e historial de precio de X en República Dominicana.')
  })
  it('lang, currency, tz, short name', () => {
    expect(htmlLang(dr)).toBe('es-DO')
    expect(currencyCode(dr)).toBe('DOP')
    expect(timeZone(dr)).toBe('America/Santo_Domingo')
    expect(countryShortName(dr)).toBe('RD')
  })
})

describe('non-DO', () => {
  const mx = buildCountry({ COUNTRY_CODE: 'MX', COUNTRY_NAME: 'México', COUNTRY_ADJECTIVE: 'mexicanas' })
  it('uses the country name and adjective', () => {
    expect(homeTitle(mx)).toContain('México')
    expect(homeDescription(mx)).toContain('tiendas mexicanas')
    expect(productDescription(mx, 'X', undefined, 0)).toBe('Ficha e historial de precio de X en México.')
    expect(countryShortName(mx)).toBe('México')
    expect(htmlLang(mx)).toBe('es-MX')
    expect(currencyCode(mx)).toBe('MXN')
  })
  it('has no guides', () => {
    expect(hasGuides(mx)).toBe(false)
    expect(hasGuides(buildCountry({}))).toBe(true)
  })
})

describe('isIndexable', () => {
  const co = buildCountry({ COUNTRY_CODE: 'CO' })
  it('DO is always indexable', () => expect(isIndexable(buildCountry({}), {})).toBe(true))
  it('others are not by default', () => expect(isIndexable(co, {})).toBe(false))
  it('COUNTRY_INDEXABLE=1 enables them', () => expect(isIndexable(co, { COUNTRY_INDEXABLE: '1' })).toBe(true))
})

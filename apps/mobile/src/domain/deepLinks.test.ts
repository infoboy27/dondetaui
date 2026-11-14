import { describe, expect, it } from 'vitest'
import { appPathFor } from './deepLinks'

describe('appPathFor', () => {
  it('maps web store pages to the app store screen', () => {
    expect(appPathFor('https://dondeta.com.do/stores/plaza-lama')).toBe('/store/plaza-lama')
    expect(appPathFor('/stores/Sirena/')).toBe('/store/sirena')
    expect(appPathFor('/store/jumbo')).toBe('/store/jumbo')
  })

  it('keeps product pages', () => {
    expect(appPathFor('https://dondeta.com.do/product/lg-nevera-123?utm_source=x')).toBe('/product/lg-nevera-123')
  })

  it('sends the Black Friday sign-up link to the app screen, keeping ?activar=1', () => {
    expect(appPathFor('https://dondeta.com.do/cuenta/black-friday?activar=1&utm_source=instagram')).toBe('/black-friday-alerts?activar=1')
    expect(appPathFor('/cuenta/black-friday')).toBe('/black-friday-alerts')
  })

  it('passes through app paths and falls back to home for the rest', () => {
    expect(appPathFor('/gaming')).toBe('/gaming')
    expect(appPathFor('dondeta://search')).toBe('/search')
    expect(appPathFor('https://dondeta.com.do/guias/algo')).toBe('/')
    expect(appPathFor('/')).toBe('/')
  })
})

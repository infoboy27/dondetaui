import { describe, expect, it } from 'vitest'
import { amazonConfig, amazonQuery, amazonSearchUrl } from './amazon'

const fridge = { name: 'Nevera Samsung 14 pies', brand: 'Samsung', categoryId: 'neveras' }

describe('amazonConfig', () => {
  it('is off without a tag', () => {
    expect(amazonConfig({})).toBeNull()
    expect(amazonConfig({ AMAZON_TAG: '  ' })).toBeNull()
  })

  it('defaults to amazon.com and accepts a full URL as domain', () => {
    expect(amazonConfig({ AMAZON_TAG: 'dondeta-20' })).toEqual({ tag: 'dondeta-20', domain: 'www.amazon.com' })
    expect(amazonConfig({ AMAZON_TAG: 'x', AMAZON_DOMAIN: 'https://www.amazon.com.mx/' })).toEqual({ tag: 'x', domain: 'www.amazon.com.mx' })
  })
})

describe('amazonQuery', () => {
  it('does not repeat a brand the name already has', () => {
    expect(amazonQuery({ name: 'Samsung Galaxy A16', brand: 'samsung' })).toBe('Samsung Galaxy A16')
    expect(amazonQuery(fridge)).toBe('Nevera Samsung 14 pies')
  })

  it('prefixes the brand when the name lacks it', () => {
    expect(amazonQuery({ name: 'Licuadora 600 W', brand: 'Oster' })).toBe('Oster Licuadora 600 W')
    expect(amazonQuery({ name: 'Licuadora', brand: '' })).toBe('Licuadora')
  })
})

describe('amazonSearchUrl', () => {
  const config = { tag: 'dondeta-20', domain: 'www.amazon.com' }

  it('builds an encoded search link with the tracking tag', () => {
    expect(amazonSearchUrl({ name: 'Oster Licuadora 600 W', brand: 'Oster', categoryId: 'cocina' }, config))
      .toBe('https://www.amazon.com/s?k=Oster%20Licuadora%20600%20W&tag=dondeta-20')
  })

  it('is null when off or for gaming products', () => {
    expect(amazonSearchUrl(fridge, null)).toBeNull()
    expect(amazonSearchUrl({ ...fridge, categoryId: 'gaming' }, config)).toBeNull()
  })
})

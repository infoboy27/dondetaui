import { describe, expect, it } from 'vitest'
import { amazonConfig, amazonQuery, amazonSearchUrl } from './amazon'

describe('amazon (SPA)', () => {
  it('is off without a tag and defaults the domain', () => {
    expect(amazonConfig(undefined)).toBeNull()
    expect(amazonConfig(' ')).toBeNull()
    expect(amazonConfig('dondeta-20')).toEqual({ tag: 'dondeta-20', domain: 'www.amazon.com' })
    expect(amazonConfig('x', 'https://www.amazon.com.mx/')).toEqual({ tag: 'x', domain: 'www.amazon.com.mx' })
  })

  it('builds the query without repeating the brand', () => {
    expect(amazonQuery({ name: 'Nevera Samsung 14 pies', brand: 'Samsung' })).toBe('Nevera Samsung 14 pies')
    expect(amazonQuery({ name: 'Licuadora 600 W', brand: 'Oster' })).toBe('Oster Licuadora 600 W')
  })

  it('links with the tag, except for gaming or when off', () => {
    const config = { tag: 'dondeta-20', domain: 'www.amazon.com' }
    expect(amazonSearchUrl({ name: 'Licuadora 600 W', brand: 'Oster', categoryId: 'cocina' }, config))
      .toBe('https://www.amazon.com/s?k=Oster%20Licuadora%20600%20W&tag=dondeta-20')
    expect(amazonSearchUrl({ name: 'Free Fire', brand: 'Garena', categoryId: 'gaming' }, config)).toBeNull()
    expect(amazonSearchUrl({ name: 'Licuadora', brand: 'Oster' }, null)).toBeNull()
  })
})

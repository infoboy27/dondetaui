import { describe, expect, it } from 'vitest'
import { rankSearchResults, searchRank, singularStem } from './search-ranking'

describe('singularStem', () => {
  it('drops Spanish plural endings', () => {
    expect(singularStem('neveras')).toBe('nevera')
    expect(singularStem('televisores')).toBe('televisor')
    expect(singularStem('aires')).toBe('aire')
    expect(singularStem('tv')).toBe('tv')
  })
})

describe('searchRank', () => {
  it('tiers by where the query word sits in the name', () => {
    expect(searchRank('Nevera Samsung 18 pies', 'neveras')).toBe(0)
    expect(searchRank('Bebedero Con Nevera Negro Whirlpool', 'neveras')).toBe(1)
    expect(searchRank('Minineveras Haier', 'neveras')).toBe(2)
    expect(searchRank('Bebedero Tecnomaster TY-LWYR33W', 'neveras')).toBe(3)
    expect(searchRank('Televisor Sony 65"', 'Televisores')).toBe(0)
    expect(searchRank('Smart TV Samsung', 'tv samsung')).toBe(1)
  })
})

describe('rankSearchResults', () => {
  it('puts fridges above dispensers that only match through the category', () => {
    const results = [
      { name: 'Bebedero Con Nevera Negro Whirlpool' },
      { name: 'Bebedero Tecnomaster TY-LWYR33W' },
      { name: 'Nevera LG 14 pies' },
      { name: 'Nevera Samsung 18 pies' },
    ]
    expect(rankSearchResults(results, 'neveras').map(r => r.name)).toEqual([
      'Nevera LG 14 pies',
      'Nevera Samsung 18 pies',
      'Bebedero Con Nevera Negro Whirlpool',
      'Bebedero Tecnomaster TY-LWYR33W',
    ])
  })

  it('keeps the incoming order without a query', () => {
    const results = [{ name: 'B' }, { name: 'A' }]
    expect(rankSearchResults(results, '  ')).toBe(results)
  })
})

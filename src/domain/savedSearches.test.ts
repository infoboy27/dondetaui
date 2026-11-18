import { describe, expect, it } from 'vitest'
import { describeMaxPrice } from './savedSearches'

describe('describeMaxPrice', () => {
  it('says when there is no limit', () => {
    expect(describeMaxPrice(null)).toBe('Cualquier precio')
  })

  it('formats the limit in the local currency', () => {
    expect(describeMaxPrice(25000)).toMatch(/^Hasta RD\$25.000$/)
  })
})

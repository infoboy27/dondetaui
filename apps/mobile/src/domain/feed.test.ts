import { describe, expect, it } from 'vitest'
import { withAdSlots } from './feed'

const kinds = (n: number, opts?: { firstAt?: number; every?: number }) =>
  withAdSlots(Array.from({ length: n }, (_, i) => i), opts).map(entry => (entry.kind === 'ad' ? 'A' : '.')).join('')

describe('withAdSlots', () => {
  it('puts the first ad after `firstAt` items, then one every `every`', () => {
    expect(kinds(20, { firstAt: 3, every: 5 })).toBe('...A.....A.....A.....A..')
  })

  it('adds no ad to short lists', () => {
    expect(kinds(6)).toBe('......')
    expect(kinds(0)).toBe('')
  })

  it('never ends the list on an ad', () => {
    expect(kinds(7)).toBe('......A.')
    expect(kinds(18)).toBe('......A............')
  })

  it('gives every ad slot a stable, unique key', () => {
    const keys = withAdSlots(Array.from({ length: 40 }, (_, i) => i)).flatMap(e => (e.kind === 'ad' ? [e.key] : []))
    expect(keys).toEqual(['ad-6', 'ad-18', 'ad-30'])
  })
})

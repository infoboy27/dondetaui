import { describe, expect, it } from 'vitest'
import { addBlocked, parseBlocked, withoutBlocked } from './reviewBlocks'

const A = 'aaaaaaaaaaaaaaaa'
const B = 'bbbbbbbbbbbbbbbb'

describe('withoutBlocked', () => {
  it('drops reviews from blocked authors and keeps the rest', () => {
    const reviews = [{ id: '1', authorKey: A }, { id: '2', authorKey: B }, { id: '3' }]
    expect(withoutBlocked(reviews, new Set([A])).map(r => r.id)).toEqual(['2', '3'])
    expect(withoutBlocked(reviews, new Set())).toBe(reviews)
  })
})

describe('local storage helpers', () => {
  it('parses only well-formed keys and survives garbage', () => {
    expect(parseBlocked(JSON.stringify([A, 'nope', 42, B]))).toEqual([A, B])
    expect(parseBlocked('{oops')).toEqual([])
    expect(parseBlocked(null)).toEqual([])
  })

  it('adds a key once and ignores malformed ones', () => {
    expect(addBlocked([A], B)).toEqual([A, B])
    expect(addBlocked([A], A)).toEqual([A])
    expect(addBlocked([A], 'x')).toEqual([A])
  })
})

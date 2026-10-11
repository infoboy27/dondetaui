import { describe, expect, it } from 'vitest'
import { pickCandidate, type Candidate } from './instagram-autopilot'

const comparison = (id: string): Candidate => ({ productId: id, name: id, imageUrl: null, kind: { type: 'comparison', savings: 1000 } })
const drop = (id: string): Candidate => ({ productId: id, name: id, imageUrl: null, kind: { type: 'drop', pct: 20, oldPrice: 5000 } })

describe('pickCandidate', () => {
  const candidates = [comparison('c1'), comparison('c2'), drop('d1')]

  it('prefers comparisons for the feed and drops for stories', () => {
    expect(pickCandidate(candidates, 'feed', new Set())?.productId).toBe('c1')
    expect(pickCandidate(candidates, 'story', new Set())?.productId).toBe('d1')
  })

  it('skips recently posted products', () => {
    expect(pickCandidate(candidates, 'feed', new Set(['c1']))?.productId).toBe('c2')
  })

  it('falls back to the other kind, then to nothing', () => {
    expect(pickCandidate(candidates, 'story', new Set(['d1']))?.productId).toBe('c1')
    expect(pickCandidate(candidates, 'feed', new Set(['c1', 'c2']))?.productId).toBe('d1')
    expect(pickCandidate(candidates, 'feed', new Set(['c1', 'c2', 'd1']))).toBeUndefined()
  })
})

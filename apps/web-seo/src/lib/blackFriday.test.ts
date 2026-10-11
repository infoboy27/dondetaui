import { describe, expect, it } from 'vitest'
import { blackFriday, blackFridayPhase } from './blackFriday'

describe('blackFriday', () => {
  it('is the day after the 4th Thursday of November', () => {
    expect(blackFriday(2026).toISOString().slice(0, 10)).toBe('2026-11-27')
    expect(blackFriday(2025).toISOString().slice(0, 10)).toBe('2025-11-28')
    expect(blackFriday(2029).toISOString().slice(0, 10)).toBe('2029-11-23')
  })

  it('counts down, then covers the weekend through Cyber Monday', () => {
    expect(blackFridayPhase(new Date('2026-10-11T15:00:00Z'))).toMatchObject({ phase: 'before', days: 47 })
    expect(blackFridayPhase(new Date('2026-11-27T15:00:00Z')).phase).toBe('during')
    expect(blackFridayPhase(new Date('2026-11-30T15:00:00Z')).phase).toBe('during')
    expect(blackFridayPhase(new Date('2026-12-01T15:00:00Z')).phase).toBe('after')
  })
})

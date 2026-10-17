import { describe, expect, it } from 'vitest'
import { blackFridayBanner, blackFridayDate } from './blackFriday'

const at = (iso: string) => new Date(`${iso}T12:00:00Z`)

describe('blackFriday', () => {
  it('is the day after the 4th Thursday of November', () => {
    expect(blackFridayDate(2026).toISOString().slice(0, 10)).toBe('2026-11-27')
    expect(blackFridayDate(2025).toISOString().slice(0, 10)).toBe('2025-11-28')
    expect(blackFridayDate(2027).toISOString().slice(0, 10)).toBe('2027-11-26')
  })

  it('stays hidden until 45 days before', () => {
    expect(blackFridayBanner(at('2026-10-12'))).toBeNull() // 46 days
    expect(blackFridayBanner(at('2026-10-13'))?.title).toBe('Black Friday en 45 días')
  })

  it('counts down, then switches wording on the day and after', () => {
    expect(blackFridayBanner(at('2026-11-26'))?.title).toBe('Black Friday es mañana')
    expect(blackFridayBanner(at('2026-11-27'))?.title).toBe('Hoy es Black Friday')
    expect(blackFridayBanner(at('2026-11-30'))?.title).toBe('Black Friday sigue') // Cyber Monday
  })

  it('disappears after Cyber Monday and in the rest of the year', () => {
    expect(blackFridayBanner(at('2026-12-01'))).toBeNull()
    expect(blackFridayBanner(at('2026-03-01'))).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { ingestionIntervalSeconds, isPeakSeason } from './ingestion-interval'

describe('isPeakSeason', () => {
  it('runs from the Wednesday before Black Friday through Cyber Monday, Dominican time', () => {
    // Black Friday 2026 is Nov 27, Cyber Monday Nov 30.
    expect(isPeakSeason(new Date('2026-11-25T03:59:00Z'))).toBe(false) // Tue 23:59 RD
    expect(isPeakSeason(new Date('2026-11-25T04:00:00Z'))).toBe(true) // Wed 00:00 RD
    expect(isPeakSeason(new Date('2026-12-01T03:59:00Z'))).toBe(true) // Mon 23:59 RD
    expect(isPeakSeason(new Date('2026-12-01T04:00:00Z'))).toBe(false)
    expect(isPeakSeason(new Date('2027-11-26T15:00:00Z'))).toBe(true) // BF 2027
  })
})

describe('ingestionIntervalSeconds', () => {
  const peak = new Date('2026-11-27T15:00:00Z')
  const normal = new Date('2026-11-13T15:00:00Z')

  it('keeps the configured interval outside the peak', () => {
    expect(ingestionIntervalSeconds({}, normal)).toBe(21_600)
    expect(ingestionIntervalSeconds({ INGESTION_INTERVAL_SECONDS: '7200' }, normal)).toBe(7_200)
  })

  it('refreshes hourly (or as configured) during the peak, never slower than normal', () => {
    expect(ingestionIntervalSeconds({}, peak)).toBe(3_600)
    expect(ingestionIntervalSeconds({ INGESTION_PEAK_INTERVAL_SECONDS: '5400' }, peak)).toBe(5_400)
    expect(ingestionIntervalSeconds({ INGESTION_INTERVAL_SECONDS: '1800' }, peak)).toBe(1_800)
  })
})

import { describe, expect, it } from 'vitest'
import { campaignRows, isPaidMedium } from './google-analytics'

const row = (dims: string[], metrics: number[]) => ({
  dimensionValues: dims.map(value => ({ value })),
  metricValues: metrics.map(value => ({ value: String(value) })),
})

describe('isPaidMedium', () => {
  it('recognises the usual paid mediums', () => {
    for (const medium of ['paid', 'paid_social', 'cpc', 'ppc', 'cpm', 'ads', 'instagram_ads', 'Paid Social']) {
      expect(isPaidMedium(medium)).toBe(true)
    }
  })

  it('leaves organic and referral traffic alone', () => {
    for (const medium of ['organic', 'referral', '(none)', 'social', 'email', 'leads']) {
      expect(isPaidMedium(medium)).toBe(false)
    }
  })
})

describe('campaignRows', () => {
  it('joins store clicks to their campaign and lists paid traffic first', () => {
    const traffic = [
      row(['google', 'organic', '(organic)'], [120, 100, 80]),
      row(['instagram', 'paid', 'eneba-lanzamiento'], [40, 35, 20]),
    ]
    const clicks = [row(['instagram', 'paid', 'eneba-lanzamiento'], [9])]

    expect(campaignRows(traffic, clicks)).toEqual([
      { source: 'instagram', medium: 'paid', campaign: 'eneba-lanzamiento', paid: true, sessions: 40, users: 35, engagedSessions: 20, offerClicks: 9 },
      { source: 'google', medium: 'organic', campaign: '(organic)', paid: false, sessions: 120, users: 100, engagedSessions: 80, offerClicks: 0 },
    ])
  })
})

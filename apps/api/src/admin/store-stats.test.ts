import { describe, expect, it } from 'vitest'
import {
  decodeReport,
  lastDays,
  parseAdmobReport,
  parseAdsenseReport,
  parseAppleSales,
  parsePlayCountry,
  parsePlayOverview,
  parseUnpaidBalance,
  summarizePlay,
} from './store-stats'

const OVERVIEW = [
  'Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Daily Device Upgrades,Total User Installs,Daily User Installs,Daily User Uninstalls,Active Device Installs,Install events,Update events,Uninstall events',
  '2026-11-25,com.jfmcss.dondeta,4,0,0,4,3,0,4,4,0,0',
  '2026-11-26,com.jfmcss.dondeta,9,1,0,12,8,1,11,9,0,1',
].join('\n')

const COUNTRY = [
  'Date,Package Name,Country,Daily Device Installs,Daily Device Uninstalls,Daily Device Upgrades,Total User Installs,Daily User Installs,Daily User Uninstalls,Active Device Installs',
  '2026-11-25,com.jfmcss.dondeta,DO,4,0,0,4,3,0,4',
  '2026-11-26,com.jfmcss.dondeta,DO,6,1,0,9,5,1,8',
  '2026-11-26,com.jfmcss.dondeta,US,3,0,0,3,3,0,3',
].join('\n')

describe('lastDays', () => {
  it('lists the window oldest first, ending on the given day', () => {
    expect(lastDays(3, new Date('2026-11-26T12:00:00Z'))).toEqual(['2026-11-24', '2026-11-25', '2026-11-26'])
  })
})

describe('decodeReport', () => {
  it('reads Play UTF-16LE exports with a BOM', () => {
    const buffer = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('Date,Country\n', 'utf16le')])
    expect(decodeReport(buffer)).toBe('Date,Country\n')
  })
  it('reads plain and BOM-prefixed UTF-8', () => {
    expect(decodeReport(Buffer.from('a,b'))).toBe('a,b')
    expect(decodeReport(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('a,b')]))).toBe('a,b')
  })
})

describe('Play installs', () => {
  it('sums user installs in the window and keeps the latest active devices', () => {
    const stats = summarizePlay(parsePlayOverview(OVERVIEW), parsePlayCountry(COUNTRY), ['2026-11-24', '2026-11-25', '2026-11-26'])
    expect(stats.installs).toBe(11)
    expect(stats.uninstalls).toBe(1)
    expect(stats.activeDevices).toBe(11)
    expect(stats.byDay[0]).toEqual({ date: '2026-11-24', installs: 0, uninstalls: 0 })
    expect(stats.byCountry).toEqual([{ label: 'DO', installs: 8 }, { label: 'US', installs: 3 }])
  })
  it('ignores days outside the window', () => {
    const stats = summarizePlay(parsePlayOverview(OVERVIEW), parsePlayCountry(COUNTRY), ['2026-11-26'])
    expect(stats.installs).toBe(8)
    expect(stats.byCountry).toEqual([{ label: 'DO', installs: 5 }, { label: 'US', installs: 3 }])
  })
  it('handles an empty report', () => {
    expect(summarizePlay([], [], ['2026-11-26'])).toMatchObject({ installs: 0, activeDevices: null, byCountry: [] })
  })
})

describe('parseAppleSales', () => {
  const header = ['Provider', 'Provider Country', 'SKU', 'Developer', 'Title', 'Version', 'Product Type Identifier', 'Units', 'Developer Proceeds', 'Begin Date', 'End Date', 'Customer Currency', 'Country Code', 'Currency of Proceeds', 'Apple Identifier'].join('\t')
  const row = (type: string, units: number, country: string, id = '6835941043') => ['APPLE', 'US', 'sku', 'dev', 'DóndeTa', '1.0.0', type, String(units), '0', '11/25/2026', '11/25/2026', 'USD', country, 'USD', id].join('\t')
  it('counts first downloads per country and updates separately, for this app only', () => {
    const text = [header, row('1', 5, 'DO'), row('1F', 2, 'CO'), row('7', 4, 'DO'), row('1', 9, 'DO', '999')].join('\n')
    const result = parseAppleSales(text, '6835941043')
    expect(result.downloads).toBe(7)
    expect(result.updates).toBe(4)
    expect([...result.byCountry]).toEqual([['DO', 5], ['CO', 2]])
  })
})

describe('earnings parsers', () => {
  const window = ['2026-11-24', '2026-11-25']
  it('AdMob: micros to dollars per day, zero-filled', () => {
    const result = parseAdmobReport([
      { },
      { row: { dimensionValues: { DATE: { value: '20261125' } }, metricValues: { ESTIMATED_EARNINGS: { microsValue: '125000' }, IMPRESSIONS: { integerValue: '40' }, CLICKS: { integerValue: '1' } } } },
      { },
    ], window)
    expect(result).toEqual({ earnings: 0.13, impressions: 40, clicks: 1, byDay: [{ date: '2026-11-24', value: 0 }, { date: '2026-11-25', value: 0.13 }] })
  })
  it('AdSense: columns by header name', () => {
    const result = parseAdsenseReport({
      headers: [{ name: 'DATE' }, { name: 'ESTIMATED_EARNINGS' }, { name: 'IMPRESSIONS' }, { name: 'CLICKS' }],
      rows: [{ cells: [{ value: '2026-11-24' }, { value: '0.05' }, { value: '30' }, { value: '0' }] }],
    }, window)
    expect(result.earnings).toBe(0.05)
    expect(result.impressions).toBe(30)
    expect(result.byDay).toEqual([{ date: '2026-11-24', value: 0.05 }, { date: '2026-11-25', value: 0 }])
  })
  it('unpaid balance from the payments list', () => {
    expect(parseUnpaidBalance({ payments: [{ name: 'accounts/pub-1/payments/2026-10-21', amount: 'USD 100.00' }, { name: 'accounts/pub-1/payments/unpaid', amount: 'USD 0.34' }] })).toBe(0.34)
    expect(parseUnpaidBalance({ payments: [{ name: 'accounts/pub-1/payments/unpaid', amount: '1,234.50' }] })).toBe(1234.5)
    expect(parseUnpaidBalance({})).toBeNull()
  })
})

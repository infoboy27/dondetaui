import { describe, expect, it } from 'vitest'
import { formatUpdatedAgo, latestFinishedAt } from './useCatalogFreshness'

describe('latestFinishedAt', () => {
  it('takes the newest completed run and ignores running ones', () => {
    const date = latestFinishedAt({
      retailers: [
        { lastStatus: 'completed', lastFinishedAt: '2026-10-11T17:51:37.702Z' },
        { lastStatus: 'running', lastFinishedAt: '2026-10-12T01:05:52.826Z' },
        { lastStatus: 'completed', lastFinishedAt: '2026-10-12T00:59:27.164Z' },
      ],
    })
    expect(date?.toISOString()).toBe('2026-10-12T00:59:27.164Z')
  })

  it('returns null when nothing has finished', () => {
    expect(latestFinishedAt({ retailers: [{ lastStatus: 'failed', lastFinishedAt: null }] })).toBeNull()
    expect(latestFinishedAt({})).toBeNull()
  })
})

describe('formatUpdatedAgo', () => {
  const now = new Date('2026-10-12T12:00:00Z')
  it('formats minutes, hours and days', () => {
    expect(formatUpdatedAgo(new Date('2026-10-12T11:59:30Z'), now)).toBe('Precios actualizados hace un momento')
    expect(formatUpdatedAgo(new Date('2026-10-12T11:35:00Z'), now)).toBe('Precios actualizados hace 25 min')
    expect(formatUpdatedAgo(new Date('2026-10-12T09:00:00Z'), now)).toBe('Precios actualizados hace 3 h')
    expect(formatUpdatedAgo(new Date('2026-10-11T10:00:00Z'), now)).toBe('Precios actualizados hace 1 día')
    expect(formatUpdatedAgo(new Date('2026-10-08T12:00:00Z'), now)).toBe('Precios actualizados hace 4 días')
  })
})

import { describe, expect, it } from 'vitest'
import library from './broll-library.json'
import {
  feedSlotAction,
  isVoicedDay,
  pickClips,
  publishAt,
  sceneTopics,
  shouldMakeVoiced,
  voicedSeason,
  voicedSlot,
  type BrollClip,
} from './voiced-reel'

describe('voiced days', () => {
  it('is Wednesday and Friday on the Dominican stack only', () => {
    expect(isVoicedDay(3, 'DO')).toBe(true)
    expect(isVoicedDay(5, 'DO')).toBe(true)
    expect(isVoicedDay(1, 'DO')).toBe(false)
    expect(isVoicedDay(3, 'CO')).toBe(false)
  })

  it('publishes at 19:00 Dominican time', () => {
    expect(publishAt('2026-11-18').toISOString()).toBe('2026-11-18T23:00:00.000Z')
  })

  it('rotates the slot twice a week', () => {
    const wed = voicedSlot('2026-11-18', 3)
    expect(voicedSlot('2026-11-20', 5)).toBe(wed + 1)
    expect(voicedSlot('2026-11-25', 3)).toBe(wed + 2)
  })
})

describe('voicedSeason', () => {
  it('covers the Wednesday before Black Friday through Cyber Monday', () => {
    expect(voicedSeason('2026-11-24', false)).toBeNull()
    expect(voicedSeason('2026-11-25', false)).toBe('black-friday-check')
    expect(voicedSeason('2026-11-27', true)).toBe('black-friday')
    expect(voicedSeason('2026-11-30', false)).toBe('black-friday-check')
    expect(voicedSeason('2026-12-01', true)).toBeNull()
  })
})

describe('shouldMakeVoiced / feedSlotAction', () => {
  it('makes the Reel once, from 09:00, while attempts last', () => {
    expect(shouldMakeVoiced({ voicedDay: true, hour: 9, existing: null, failures: 0 })).toBe(true)
    expect(shouldMakeVoiced({ voicedDay: true, hour: 8, existing: null, failures: 0 })).toBe(false)
    expect(shouldMakeVoiced({ voicedDay: false, hour: 10, existing: null, failures: 0 })).toBe(false)
    expect(shouldMakeVoiced({ voicedDay: true, hour: 10, existing: 'cancelled', failures: 0 })).toBe(false)
    expect(shouldMakeVoiced({ voicedDay: true, hour: 10, existing: null, failures: 3 })).toBe(false)
  })

  it('keeps the regular feed post out of the way unless the voiced Reel was cancelled or failed to be made', () => {
    expect(feedSlotAction({ voicedDay: false, existing: null, failures: 0 })).toBe('post')
    expect(feedSlotAction({ voicedDay: true, existing: 'scheduled', failures: 0 })).toBe('skip')
    expect(feedSlotAction({ voicedDay: true, existing: 'published', failures: 0 })).toBe('skip')
    expect(feedSlotAction({ voicedDay: true, existing: 'cancelled', failures: 0 })).toBe('post')
    expect(feedSlotAction({ voicedDay: true, existing: null, failures: 1 })).toBe('wait')
    expect(feedSlotAction({ voicedDay: true, existing: null, failures: 3 })).toBe('post')
  })
})

describe('pickClips', () => {
  const scenes = [{ scene: 'hook' as const }, { scene: 'product' as const, categoryId: 'lavadoras' }, { scene: 'how' as const }, { scene: 'cta' as const }]

  it('maps scenes to topics', () => {
    expect(sceneTopics('product', 'neveras')[0]).toBe('appliances')
    expect(sceneTopics('product', 'televisores')[0]).toBe('home')
    expect(sceneTopics('product', 'otra-cosa')[0]).toBe('phone')
  })

  it('finds a distinct clip for every scene in the real library, avoiding recent ones', () => {
    const picks = pickClips(library as BrollClip[], scenes, [], 0, '2026-11-18')!
    expect(picks).toHaveLength(4)
    expect(new Set(picks.map(p => p.id)).size).toBe(4)
    expect(picks[1].topics).toContain('appliances')
    const again = pickClips(library as BrollClip[], scenes, picks.map(p => p.id), 0, '2026-11-18')!
    expect(again.some(p => picks.map(x => x.id).includes(p.id))).toBe(false)
  })

  it('leaves Christmas clips out of season, and falls back to recent clips when nothing else fits', () => {
    const tiny: BrollClip[] = [
      { id: 'x', file: 'x.mp4', topics: ['hook', 'christmas'] },
      { id: 'h', file: 'h.mp4', topics: ['hook'] },
    ]
    expect(pickClips(tiny, [{ scene: 'hook' }], [], 0, '2026-11-18')![0].id).toBe('h')
    expect(pickClips(tiny, [{ scene: 'hook' }], ['h'], 0, '2026-11-18')![0].id).toBe('h')
    expect(pickClips(tiny, [{ scene: 'hook' }, { scene: 'hook' }], [], 0, '2026-11-18')).toBeNull()
  })
})

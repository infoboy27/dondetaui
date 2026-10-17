import { describe, expect, it } from 'vitest'
import { dueDecision } from './instagram-scheduled'

const at = (iso: string) => new Date(iso)

describe('dueDecision', () => {
  const publishAt = at('2026-11-27T15:00:00Z') // 11:00 Dominican time

  it('waits until the scheduled time', () => {
    expect(dueDecision(publishAt, at('2026-11-27T14:59:59Z'))).toBe('wait')
  })

  it('publishes from the scheduled time, within the late window', () => {
    expect(dueDecision(publishAt, at('2026-11-27T15:00:00Z'))).toBe('publish')
    expect(dueDecision(publishAt, at('2026-11-27T21:00:00Z'))).toBe('publish') // 6 h late
  })

  it('gives up when it is more than 6 h late', () => {
    expect(dueDecision(publishAt, at('2026-11-27T21:00:01Z'))).toBe('missed')
    expect(dueDecision(publishAt, at('2026-11-28T15:00:00Z'))).toBe('missed')
  })
})

import { describe, expect, it } from 'vitest'
import { BUYING_GUIDES, guideReadingMinutes } from './content'

describe('BUYING_GUIDES', () => {
  const slugs = new Set(BUYING_GUIDES.map(g => g.slug))

  it('has unique slugs', () => {
    expect(slugs.size).toBe(BUYING_GUIDES.length)
  })

  it('only relates to guides that exist', () => {
    for (const guide of BUYING_GUIDES) {
      for (const related of guide.related ?? []) expect(slugs.has(related), `${guide.slug} -> ${related}`).toBe(true)
    }
  })

  it('gives every guide enough body to be worth reading', () => {
    for (const guide of BUYING_GUIDES) {
      expect(guide.sections.length, guide.slug).toBeGreaterThanOrEqual(4)
      expect(guideReadingMinutes(guide), guide.slug).toBeGreaterThanOrEqual(3)
    }
  })
})

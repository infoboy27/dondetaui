import { describe, expect, it } from 'vitest'
import { utmLink, utmSlug } from './utm'

describe('utmSlug', () => {
  it('lowercases, strips accents and joins words with dashes', () => {
    expect(utmSlug('  Eneba × Lanzamiento Octubre ')).toBe('eneba-lanzamiento-octubre')
    expect(utmSlug('Promoción Gaming')).toBe('promocion-gaming')
  })
})

describe('utmLink', () => {
  it('adds the campaign parameters to the landing page', () => {
    expect(utmLink({ url: 'https://dondeta.com.do/?cat=gaming', source: 'Instagram', medium: 'paid', campaign: 'Eneba Lanzamiento' }))
      .toBe('https://dondeta.com.do/?cat=gaming&utm_source=instagram&utm_medium=paid&utm_campaign=eneba-lanzamiento')
  })

  it('replaces old utm values and drops an empty content', () => {
    expect(utmLink({ url: 'https://dondeta.com.do/?utm_source=x&utm_content=old', source: 'instagram', medium: 'paid', campaign: 'gaming', content: '' }))
      .toBe('https://dondeta.com.do/?utm_source=instagram&utm_medium=paid&utm_campaign=gaming')
  })

  it('returns null for something that is not a URL', () => {
    expect(utmLink({ url: 'dondeta', source: 'instagram', medium: 'paid', campaign: 'x' })).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { facebookCaption, facebookLink } from './facebook-caption'

const IG = [
  '💰 RD$26,600 de diferencia por el mismo modelo',
  'Nevera Samsung 14 pies',
  '',
  '✅ Jumbo: RD$30,000',
  '',
  '¿Tú sabías que había tanta diferencia? 👇',
  '',
  '🔎 Compara cualquier electrodoméstico gratis en dondeta.com.do (link en la bio)',
  '📍 Santo Domingo, República Dominicana',
  '',
  '#DóndeTa #OfertasRD #SantoDomingo #Neveras #AhorroRD',
].join('\n')

describe('facebookCaption', () => {
  it('drops the "link en la bio" line, adds the direct link and keeps three hashtags', () => {
    const out = facebookCaption(IG, 'https://dondeta.com.do/product/x')
    expect(out).not.toContain('link en la bio')
    expect(out).toContain('👉 https://dondeta.com.do/product/x')
    expect(out.split('\n').at(-1)).toBe('#DóndeTa #OfertasRD #SantoDomingo')
    expect(out).toContain('RD$26,600 de diferencia')
    expect(out).toContain('📍 Santo Domingo')
    expect(out).not.toMatch(/\n{3,}/)
  })

  it('handles the English bio line and a post without a link', () => {
    const out = facebookCaption('Hello\n🔎 Compare at x (link in bio)\n#A #B #C #D #E', null)
    expect(out).toBe('Hello\n\n#A #B #C')
  })
})

describe('facebookLink', () => {
  it('tags the link for analytics', () => {
    const url = new URL(facebookLink('https://co.dondeta.com.do', '/product/nevera-1', 'autopilot'))
    expect(url.pathname).toBe('/product/nevera-1')
    expect(url.searchParams.get('utm_source')).toBe('facebook')
    expect(url.searchParams.get('utm_campaign')).toBe('autopilot')
  })
})

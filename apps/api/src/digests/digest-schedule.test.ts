import { describe, expect, it } from 'vitest'
import { dealDigestEmail } from '../auth/account-emails'
import type { PriceCheck } from '../products/price-check'
import { pickDigestDeals } from './digest-deals'
import { digestLinks, digestSlot, isDigestTopic, isWellFormedToken, newUnsubscribeToken } from './digest-schedule'

describe('digestSlot', () => {
  // Black Friday 2026 is Fri Nov 27; Cyber Monday Nov 30. RD = UTC-4.
  it('sends on the Wednesday before, Black Friday and Cyber Monday', () => {
    expect(digestSlot(new Date('2026-11-25T14:00:00Z'))).toEqual({ day: '2026-11-25', eventName: 'Black Friday se adelanta' })
    expect(digestSlot(new Date('2026-11-27T14:00:00Z'))).toEqual({ day: '2026-11-27', eventName: 'Black Friday' })
    expect(digestSlot(new Date('2026-11-30T14:00:00Z'))).toEqual({ day: '2026-11-30', eventName: 'Cyber Monday' })
  })

  it('stays quiet on the other days', () => {
    for (const iso of ['2026-11-13T14:00:00Z', '2026-11-26T14:00:00Z', '2026-11-28T14:00:00Z', '2026-12-01T14:00:00Z']) {
      expect(digestSlot(new Date(iso))).toBeNull()
    }
  })

  it('waits until 09:00 Dominican time and uses the Dominican date', () => {
    expect(digestSlot(new Date('2026-11-27T12:59:00Z'))).toBeNull() // 08:59 RD
    expect(digestSlot(new Date('2026-11-27T13:00:00Z'))?.day).toBe('2026-11-27') // 09:00 RD
    // 23:30 RD on Black Friday is already Nov 28 in UTC.
    expect(digestSlot(new Date('2026-11-28T03:30:00Z'))?.day).toBe('2026-11-27')
  })

  it('follows the date every year', () => {
    expect(digestSlot(new Date('2027-11-26T14:00:00Z'))?.eventName).toBe('Black Friday')
  })
})

describe('unsubscribe tokens', () => {
  it('are 48 hex chars, random, and validated strictly', () => {
    const a = newUnsubscribeToken()
    expect(isWellFormedToken(a)).toBe(true)
    expect(a).not.toBe(newUnsubscribeToken())
    expect(isWellFormedToken('abc')).toBe(false)
    expect(isWellFormedToken(`${a.slice(0, 47)}Z`)).toBe(false)
    expect(isWellFormedToken(42)).toBe(false)
  })

  it('only accepts known topics', () => {
    expect(isDigestTopic('black-friday')).toBe(true)
    expect(isDigestTopic('anything')).toBe(false)
  })
})

const check = (id: string, slug = id): PriceCheck => ({
  productId: id, productName: `Producto ${id}`, productSlug: slug, image: 'https://img.test/a.jpg', store: 'Jumbo',
  current: 900, verdict: 'lowest', reference: 1000, referenceDate: '2026-11-01', peak: 1100, peakDate: '2026-11-05',
  pctVsReference: -10, pctBelowPeak: 18.2, days: 20,
})

describe('pickDigestDeals', () => {
  it('drops excluded (gaming) and slug-less products and caps the list', () => {
    const deals = pickDigestDeals([check('a'), check('robux'), check('b', ''), check('c'), check('d')], new Set(['robux']), 2)
    expect(deals.map(d => d.productId)).toEqual(['a', 'c'])
  })
})

describe('dealDigestEmail', () => {
  const links = digestLinks('nevera-lg', 'f'.repeat(48), 2026)
  const email = dealDigestEmail({
    name: 'Ana Pérez',
    eventName: 'Black Friday',
    pageUrl: links.page,
    unsubscribeUrl: links.unsubscribe,
    deals: [{ name: 'Nevera <LG>', price: 'RD$24,495', store: 'Jumbo', note: '12 % bajo su mínimo de 30 días', url: links.product, imageUrl: 'https://img.test/n.jpg' }],
  })

  it('lists each deal with tracked links and a one-click unsubscribe', () => {
    expect(email.subject).toBe('Black Friday: 1 oferta real de hoy (comparadas con 30 días)')
    expect(email.text.startsWith('Hola, Ana:')).toBe(true)
    expect(email.text).toContain('Nevera <LG> — RD$24,495 en Jumbo')
    expect(links.product).toBe('https://dondeta.com.do/product/nevera-lg?utm_source=email&utm_medium=email&utm_campaign=black-friday-2026')
    expect(email.html).toContain('utm_campaign=black-friday-2026')
    expect(email.html).toContain(`https://dondeta.com.do/cuenta/black-friday?baja=${'f'.repeat(48)}`)
    expect(email.text).toContain('Dejar de recibir estos correos')
  })

  it('escapes product names in the html', () => {
    expect(email.html).toContain('Nevera &lt;LG&gt;')
    expect(email.html).not.toContain('<LG>')
  })
})

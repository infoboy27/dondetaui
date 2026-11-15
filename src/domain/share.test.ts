import { describe, expect, it } from 'vitest'
import { productShareUrl, shareMessage, shareSiteUrl, shortName, whatsappShareHref } from './share'

describe('productShareUrl', () => {
  it('tags the product page with the share UTMs', () => {
    expect(productShareUrl('https://dondeta.com.do', 'nevera-lg-123', 'whatsapp')).toBe(
      'https://dondeta.com.do/product/nevera-lg-123?utm_source=whatsapp&utm_medium=share&utm_campaign=producto',
    )
  })

  it('drops a trailing slash and encodes the slug', () => {
    expect(productShareUrl('https://dondeta.com.do/', 'a b', 'web_share')).toBe(
      'https://dondeta.com.do/product/a%20b?utm_source=web_share&utm_medium=share&utm_campaign=producto',
    )
  })
})

describe('shareMessage', () => {
  it('names the best price and store', () => {
    expect(shareMessage('Nevera LG 14 pies', { price: 'RD$24,495', store: 'Plaza Lama' })).toBe(
      "Nevera LG 14 pies a RD$24,495 en Plaza Lama 👀\n¿Dónde 'ta más barato? Míralo en DóndeTa:",
    )
  })

  it('works without a price', () => {
    expect(shareMessage('Nevera LG')).toBe("Nevera LG 👀\n¿Dónde 'ta más barato? Míralo en DóndeTa:")
  })
})

describe('shortName', () => {
  it('keeps short names and collapses whitespace', () => {
    expect(shortName('  Nevera   LG ')).toBe('Nevera LG')
  })

  it('cuts long names with an ellipsis', () => {
    const name = shortName('x'.repeat(120))
    expect(name).toHaveLength(80)
    expect(name.endsWith('…')).toBe(true)
  })
})

describe('whatsappShareHref', () => {
  it('puts message and link in one encoded wa.me text', () => {
    const href = whatsappShareHref("¿Dónde 'ta?", 'https://dondeta.com.do/product/x?utm_source=whatsapp&utm_medium=share')
    expect(href.startsWith('https://wa.me/?text=')).toBe(true)
    expect(decodeURIComponent(href.slice('https://wa.me/?text='.length))).toBe(
      "¿Dónde 'ta?\nhttps://dondeta.com.do/product/x?utm_source=whatsapp&utm_medium=share",
    )
  })
})

describe('shareSiteUrl', () => {
  it('uses the web origin', () => {
    expect(shareSiteUrl('https://co.dondeta.com.do')).toBe('https://co.dondeta.com.do')
  })

  it('falls back to the public site in a native shell', () => {
    expect(shareSiteUrl('capacitor://localhost')).toBe('https://dondeta.com.do')
    expect(shareSiteUrl(undefined)).toBe('https://dondeta.com.do')
  })
})

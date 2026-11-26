import { describe, expect, it } from 'vitest'
import { accountDeletedEmail, backInStockEmail, cardDiscountEmail, dealRealEmail, loginCodeEmail, lowestPrice90dEmail, mfaChangedEmail, passwordChangedEmail, priceDropEmail, resetPasswordEmail, savedSearchEmail, weeklyDigestEmail, welcomeEmail } from './account-emails'

describe('account emails', () => {
  it('puts the code in the subject, the text and the html', () => {
    for (const email of [welcomeEmail('Ana', '042731'), resetPasswordEmail(null, '042731'), loginCodeEmail('Ana', '042731')]) {
      expect(email.subject).toContain('042731')
      expect(email.text).toContain('Tu código: 042731')
      expect(email.html).toContain('042731')
    }
  })

  it('greets by first name, or generically without one', () => {
    expect(welcomeEmail('Ana María Pérez', '000000').text.startsWith('Hola, Ana:')).toBe(true)
    expect(welcomeEmail(null, '000000').text.startsWith('Hola:')).toBe(true)
    expect(welcomeEmail('   ', '000000').text.startsWith('Hola:')).toBe(true)
  })

  it('escapes user-provided names in the html', () => {
    const email = welcomeEmail('<script>alert(1)</script>', '000000')
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })

  it('describes the 2FA method that was turned on, or that it was turned off', () => {
    expect(mfaChangedEmail(null, 'totp').text).toContain('app autenticadora')
    expect(mfaChangedEmail(null, 'email').text).toContain('por correo')
    expect(mfaChangedEmail(null, null).subject).toContain('Desactivaste')
  })

  it('has security notices without codes', () => {
    expect(passwordChangedEmail('Ana').text).not.toContain('Tu código')
    expect(accountDeletedEmail('Ana').text).toContain('Eliminamos tu cuenta')
  })

  it('shows the hosted logo in every email', () => {
    for (const email of [welcomeEmail(null, '000000'), passwordChangedEmail(null), priceDropEmail('Nevera', 'RD$1,000')]) {
      expect(email.html).toContain('https://dondeta.com.do/email/dondeta-logo.png')
    }
  })

  it('price-drop email names the product and price, with a button and a text link', () => {
    const email = priceDropEmail('Nevera <X>', 'RD$24,495')
    expect(email.subject).toBe('Bajó de precio: Nevera <X> ahora RD$24,495')
    expect(email.text).toContain('Nevera <X> ahora cuesta RD$24,495.')
    expect(email.text).toContain('Ver la oferta: https://dondeta.com.do')
    expect(email.html).toContain('Ver la oferta')
    expect(email.html).not.toContain('<X>')
  })

  it('price-drop email says when it is also the 90-day low (one message, not two)', () => {
    const merged = priceDropEmail('TV', 'RD$9,000', { lowest90d: true })
    expect(merged.subject).toBe('Precio más bajo en 90 días: TV ahora RD$9,000')
    expect(merged.text).toContain('su precio más bajo de los últimos 90 días')
    expect(merged.html).toContain('Más bajo en 90 días')
    expect(priceDropEmail('TV', 'RD$9,000', { lowest90d: false }).subject).toBe('Bajó de precio: TV ahora RD$9,000')
  })
})

describe('watch notification emails', () => {
  const row = { name: 'Nevera <X>', price: 'RD$20,000', store: 'Jumbo', note: 'Nuevo en DóndeTa', url: 'https://dondeta.com.do/product/x' }

  it('every watch email says where to turn it off', () => {
    const emails = [
      backInStockEmail({ name: 'TV', price: 'RD$9,000', store: 'Jumbo', url: 'https://dondeta.com.do/product/tv' }),
      lowestPrice90dEmail({ name: 'TV', price: 'RD$9,000', url: 'https://dondeta.com.do/product/tv' }),
      cardDiscountEmail({ store: 'Jumbo', phrase: '10 % con tarjetas BHD', endsOn: '30 de noviembre', products: [row] }),
      savedSearchEmail({ query: 'nevera', maxPrice: null, products: [row] }),
      weeklyDigestEmail({ name: 'Ana', summary: '1 bajó de precio', products: [row], pageUrl: 'https://dondeta.com.do/alerts' }),
      dealRealEmail({ seasonName: 'Black Friday', products: [row] }),
    ]
    for (const email of emails) {
      expect(email.text).toContain('Perfil › Notificaciones')
      expect(email.html).not.toContain('<X>')
    }
  })

  it('back in stock names the store only when known', () => {
    expect(backInStockEmail({ name: 'TV', price: 'RD$9,000', store: 'Jumbo', url: 'https://dondeta.com.do' }).text).toContain('otra vez en Jumbo')
    expect(backInStockEmail({ name: 'TV', price: 'RD$9,000', store: null, url: 'https://dondeta.com.do' }).text).toContain('otra vez, a RD$9,000')
  })

  it('saved search counts products and mentions the max price', () => {
    expect(savedSearchEmail({ query: 'nevera', maxPrice: 'RD$25,000', products: [row] }).text).toContain('1 producto nuevo o más barato para “nevera” por RD$25,000 o menos')
    expect(savedSearchEmail({ query: 'nevera', maxPrice: null, products: [row, row] }).text).toContain('2 productos nuevos o más baratos para “nevera”:')
  })

  it('deal rows leave out an unknown store', () => {
    expect(savedSearchEmail({ query: 'tv', maxPrice: null, products: [{ ...row, store: '' }] }).text).toContain('• Nevera <X> — RD$20,000 (Nuevo en DóndeTa)')
  })

  it('seasonal offers word one vs several', () => {
    expect(dealRealEmail({ seasonName: 'Black Friday', products: [row] }).subject).toBe('Black Friday: 1 oferta real en lo que guardaste')
    expect(dealRealEmail({ seasonName: 'Cyber Monday', products: [row, row] }).subject).toBe('Cyber Monday: 2 ofertas reales en lo que guardaste')
  })
})

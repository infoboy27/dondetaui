import { describe, expect, it } from 'vitest'
import { accountDeletedEmail, loginCodeEmail, mfaChangedEmail, passwordChangedEmail, priceDropEmail, resetPasswordEmail, welcomeEmail } from './account-emails'

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
    expect(email.subject).toBe('Bajó de precio: Nevera <X>')
    expect(email.text).toContain('Nevera <X> ahora cuesta RD$24,495.')
    expect(email.text).toContain('Ver la oferta: https://dondeta.com.do')
    expect(email.html).toContain('Ver la oferta')
    expect(email.html).not.toContain('<X>')
  })
})

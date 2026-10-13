import { describe, expect, it } from 'vitest'
import { accountDeletedEmail, loginCodeEmail, mfaChangedEmail, passwordChangedEmail, resetPasswordEmail, welcomeEmail } from './account-emails'

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
})

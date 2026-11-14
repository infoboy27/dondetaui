import { describe, expect, it } from 'vitest'
import { describeSource, digestSubscribedMessage, parseSignupSource, signupMessage } from './signup-alert'

describe('parseSignupSource', () => {
  it('reads the whitelisted keys the web app sends', () => {
    expect(parseSignupSource('utm_source=instagram&utm_medium=paid&utm_campaign=black-friday-2026&landing=%2Fcuenta%2Fblack-friday&ref=l.instagram.com&evil=1'))
      .toEqual({ utmSource: 'instagram', utmMedium: 'paid', utmCampaign: 'black-friday-2026', landing: '/cuenta/black-friday', ref: 'l.instagram.com' })
  })

  it('strips markup and mentions, and tolerates junk', () => {
    expect(parseSignupSource('utm_source=<b>@everyone</b>')).toEqual({ utmSource: 'beveryone/b' })
    expect(parseSignupSource(undefined)).toEqual({})
    expect(parseSignupSource('')).toEqual({})
  })
})

describe('signupMessage', () => {
  it('builds the Discord text with masked email, origin and total', () => {
    const text = signupMessage({
      email: 'maria@hotmail.com',
      source: parseSignupSource('utm_source=instagram&utm_medium=paid&landing=%2Fcuenta%2Fblack-friday'),
      totalUsers: 1234,
    })
    expect(text).toBe([
      '🆕 Nuevo registro en DóndeTa',
      '• Cuenta: m•••@hotmail.com',
      '• Origen: instagram / paid · entró por /cuenta/black-friday',
      '• Vino a suscribirse a las ofertas de Black Friday',
      '• Total de cuentas: 1,234',
    ].join('\n'))
  })

  it('says "directo" without attribution and skips an unknown total', () => {
    expect(describeSource({})).toBe('directo')
    expect(signupMessage({ email: 'x@y.do', source: {}, totalUsers: null })).not.toContain('Total')
  })

  it('announces digest subscriptions', () => {
    expect(digestSubscribedMessage('pedro@gmail.com', 'black-friday')).toBe('📩 p•••@gmail.com se suscribió a las ofertas de Black Friday')
  })
})

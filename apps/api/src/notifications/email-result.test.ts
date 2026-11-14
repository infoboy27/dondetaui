import { describe, expect, it } from 'vitest'
import { assertSent } from './email-result'

describe('assertSent', () => {
  it('throws when Resend rejects the email instead of pretending it went out', () => {
    expect(() => assertSent({ error: { name: 'validation_error', message: 'The dondeta.com.do domain is not verified.' } }))
      .toThrow('email not sent (validation_error): The dondeta.com.do domain is not verified.')
  })

  it('accepts a successful send', () => {
    expect(() => assertSent({ error: null })).not.toThrow()
    expect(() => assertSent({})).not.toThrow()
  })
})

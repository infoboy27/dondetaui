import { afterEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn()
vi.mock('resend', () => ({ Resend: class { emails = { send } } }))

import { EmailProvider } from './email.provider'

describe('EmailProvider', () => {
  afterEach(() => {
    send.mockReset()
    delete process.env.RESEND_API_KEY
  })

  it('throws when Resend rejects the email instead of pretending it went out', async () => {
    process.env.RESEND_API_KEY = 're_test'
    send.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'The dondeta.com.do domain is not verified.' } })
    await expect(new EmailProvider().send('a@b.do', 'Hola', 'texto')).rejects.toThrow('domain is not verified')
  })

  it('resolves when Resend accepts it', async () => {
    process.env.RESEND_API_KEY = 're_test'
    send.mockResolvedValue({ data: { id: 'x' }, error: null })
    await expect(new EmailProvider().send('a@b.do', 'Hola', 'texto')).resolves.toBeUndefined()
  })

  it('only logs without an API key', async () => {
    await expect(new EmailProvider().send('a@b.do', 'Hola', 'texto')).resolves.toBeUndefined()
    expect(send).not.toHaveBeenCalled()
  })
})

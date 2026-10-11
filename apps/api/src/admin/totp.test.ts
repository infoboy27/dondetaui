import { describe, expect, it } from 'vitest'
import { base32Decode, base32Encode, decryptSecret, encryptSecret, generateSecret, totpCode, verifyTotp } from './totp'

describe('totp', () => {
  // RFC 6238 appendix B test vector (SHA-1 secret "12345678901234567890").
  const rfcSecret = base32Encode(Buffer.from('12345678901234567890'))

  it('matches the RFC 6238 test vectors (last 6 digits)', () => {
    expect(totpCode(rfcSecret, 59_000)).toBe('287082')
    expect(totpCode(rfcSecret, 1_111_111_109_000)).toBe('081804')
    expect(totpCode(rfcSecret, 1_234_567_890_000)).toBe('005924')
  })

  it('round-trips base32', () => {
    const bytes = Buffer.from('DóndeTa admin 2FA')
    expect(base32Decode(base32Encode(bytes)).equals(bytes)).toBe(true)
  })

  it('accepts the current code and one step of clock drift, nothing else', () => {
    const secret = generateSecret()
    const now = 1_800_000_000_000
    expect(verifyTotp(secret, totpCode(secret, now), now)).toBe(true)
    expect(verifyTotp(secret, totpCode(secret, now - 30_000), now)).toBe(true)
    expect(verifyTotp(secret, totpCode(secret, now - 90_000), now)).toBe(false)
    expect(verifyTotp(secret, 'abcdef', now)).toBe(false)
  })

  it('encrypts secrets at rest', () => {
    process.env.JWT_SECRET = 'test-secret'
    const secret = generateSecret()
    const stored = encryptSecret(secret)
    expect(stored).not.toContain(secret)
    expect(decryptSecret(stored)).toBe(secret)
  })
})

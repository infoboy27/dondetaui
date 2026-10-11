import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// RFC 6238 TOTP (30 s steps, 6 digits, HMAC-SHA1) -- what Google Authenticator,
// Authy and 1Password expect. No dependency: it's ~40 lines of crypto.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of clean) {
    const index = ALPHABET.indexOf(char)
    if (index < 0) throw new Error('Invalid base32')
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20))
}

export function totpCode(secret: string, timeMs = Date.now(), step = 30): string {
  const counter = Math.floor(timeMs / 1000 / step)
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', base32Decode(secret)).update(message).digest()
  const offset = hmac[hmac.length - 1] & 15
  const binary = ((hmac[offset] & 127) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(binary % 1_000_000).padStart(6, '0')
}

// Accepts the previous/next step too, for phone clocks a little off.
export function verifyTotp(secret: string, code: string, timeMs = Date.now()): boolean {
  const clean = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(totpCode(secret, timeMs + drift * 30_000))
    if (timingSafeEqual(expected, Buffer.from(clean))) return true
  }
  return false
}

export function otpauthUrl(account: string, secret: string, issuer = 'DóndeTa Admin'): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

// Secrets at rest are AES-256-GCM encrypted with a key derived from
// JWT_SECRET, so a database dump alone doesn't hand out the second factor.
function key(): Buffer {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return createHash('sha256').update(`totp:${secret}`).digest()
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map(part => part.toString('base64')).join('.')
}

export function decryptSecret(stored: string): string {
  const [iv, tag, data] = stored.split('.').map(part => Buffer.from(part, 'base64'))
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

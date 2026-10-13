import { describe, expect, it } from 'vitest'
import { codeMatches, generateCode, hashCode, maskEmail } from './codes'

const SECRET = 'test-secret'
const USER = '11111111-1111-1111-1111-111111111111'

describe('auth codes', () => {
  it('generates 6-digit numeric codes', () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/)
  })

  it('matches only the same code, user and purpose', () => {
    const stored = hashCode('123456', USER, 'reset_password', SECRET)
    expect(codeMatches('123456', stored, USER, 'reset_password', SECRET)).toBe(true)
    expect(codeMatches('123 456', stored, USER, 'reset_password', SECRET)).toBe(true)
    expect(codeMatches('123457', stored, USER, 'reset_password', SECRET)).toBe(false)
    expect(codeMatches('123456', stored, USER, 'login', SECRET)).toBe(false)
    expect(codeMatches('123456', stored, '22222222-2222-2222-2222-222222222222', 'reset_password', SECRET)).toBe(false)
    expect(codeMatches('123456', stored, USER, 'reset_password', 'other-secret')).toBe(false)
  })

  it('rejects anything that is not 6 digits', () => {
    const stored = hashCode('123456', USER, 'login', SECRET)
    expect(codeMatches('', stored, USER, 'login', SECRET)).toBe(false)
    expect(codeMatches('12345', stored, USER, 'login', SECRET)).toBe(false)
    expect(codeMatches('abcdef', stored, USER, 'login', SECRET)).toBe(false)
  })

  it('masks emails', () => {
    expect(maskEmail('jonatan@gmail.com')).toBe('j•••@gmail.com')
    expect(maskEmail('not-an-email')).toBe('not-an-email')
  })
})

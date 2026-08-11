import { describe, expect, it } from 'vitest'
import { userInitials } from './user'
import type { User } from '../types'

describe('userInitials', () => {
  it('uses the first letter of the first two words in the name', () => {
    const user: User = { id: '1', email: 'x@y.com', name: 'Carlos Almonte' }
    expect(userInitials(user)).toBe('CA')
  })

  it('falls back to the email when name is null', () => {
    const user: User = { id: '1', email: 'test@example.com', name: null }
    expect(userInitials(user)).toBe('TE')
  })

  it('falls back to the email when name is blank', () => {
    const user: User = { id: '1', email: 'test@example.com', name: '   ' }
    expect(userInitials(user)).toBe('TE')
  })

  it('uses the first two characters when the name has only one word', () => {
    const user: User = { id: '1', email: 'x@y.com', name: 'Madonna' }
    expect(userInitials(user)).toBe('MA')
  })
})

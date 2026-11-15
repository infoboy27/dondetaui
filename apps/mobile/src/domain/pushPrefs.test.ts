import { describe, expect, it } from 'vitest'
import { decidePushAction, notificationPath, parsePushPref } from './pushPrefs'

describe('decidePushAction', () => {
  it('never prompts on sign-in, but refreshes the token when already allowed', () => {
    expect(decidePushAction({ trigger: 'signin', pref: 'unset', permission: 'undetermined', canAskAgain: true })).toBe('skip')
    expect(decidePushAction({ trigger: 'signin', pref: 'unset', permission: 'granted', canAskAgain: true })).toBe('register')
    expect(decidePushAction({ trigger: 'signin', pref: 'on', permission: 'granted', canAskAgain: true })).toBe('register')
  })

  it('asks the first time the user follows something', () => {
    expect(decidePushAction({ trigger: 'follow', pref: 'unset', permission: 'undetermined', canAskAgain: true })).toBe('ask')
    expect(decidePushAction({ trigger: 'follow', pref: 'unset', permission: 'granted', canAskAgain: true })).toBe('register')
  })

  it('does not nag after a denial or when the user turned push off', () => {
    expect(decidePushAction({ trigger: 'follow', pref: 'unset', permission: 'denied', canAskAgain: false })).toBe('skip')
    expect(decidePushAction({ trigger: 'follow', pref: 'off', permission: 'undetermined', canAskAgain: true })).toBe('skip')
    expect(decidePushAction({ trigger: 'signin', pref: 'off', permission: 'granted', canAskAgain: true })).toBe('skip')
  })

  it('turning the switch on asks, registers or sends to Settings', () => {
    expect(decidePushAction({ trigger: 'enable', pref: 'off', permission: 'undetermined', canAskAgain: true })).toBe('ask')
    expect(decidePushAction({ trigger: 'enable', pref: 'off', permission: 'granted', canAskAgain: false })).toBe('register')
    expect(decidePushAction({ trigger: 'enable', pref: 'unset', permission: 'denied', canAskAgain: false })).toBe('openSettings')
  })
})

describe('parsePushPref', () => {
  it('falls back to unset for anything unknown', () => {
    expect(parsePushPref('on')).toBe('on')
    expect(parsePushPref('off')).toBe('off')
    expect(parsePushPref(null)).toBe('unset')
    expect(parsePushPref('maybe')).toBe('unset')
  })
})

describe('notificationPath', () => {
  it('opens the product screen from a price-drop push', () => {
    expect(notificationPath({ type: 'price-drop', url: '/product/nevera-whirlpool-18' })).toBe('/product/nevera-whirlpool-18')
    expect(notificationPath({ url: 'https://dondeta.com.do/product/tv-55' })).toBe('/product/tv-55')
  })

  it('returns null when there is nowhere specific to go', () => {
    expect(notificationPath(undefined)).toBeNull()
    expect(notificationPath({})).toBeNull()
    expect(notificationPath({ url: 42 })).toBeNull()
    expect(notificationPath({ url: '/somewhere-unknown' })).toBeNull()
  })
})

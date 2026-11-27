import { describe, expect, it } from 'vitest'
import { APP_STORE_URL, PLAY_STORE_URL, isIosSafari, mobilePlatform, shouldShowAppBanner, storeUrl } from './appStores'

const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IG_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0'
const CHROME_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'

describe('app stores', () => {
  it('detects the phone platform and its store', () => {
    expect(mobilePlatform(ANDROID)).toBe('android')
    expect(mobilePlatform(IG_IOS)).toBe('ios')
    expect(mobilePlatform(DESKTOP)).toBeNull()
    expect(storeUrl('ios')).toBe(APP_STORE_URL)
    expect(storeUrl('android')).toBe(PLAY_STORE_URL)
  })
  it('treats only plain Safari as having the native banner', () => {
    expect(isIosSafari(SAFARI)).toBe(true)
    expect(isIosSafari(CHROME_IOS)).toBe(false)
    expect(isIosSafari(IG_IOS)).toBe(false)
  })
  it('shows our banner on phones without the native one, and snoozes it after a dismissal', () => {
    const now = new Date('2026-11-27T12:00:00Z')
    expect(shouldShowAppBanner(ANDROID, null, now)).toBe(true)
    expect(shouldShowAppBanner(IG_IOS, null, now)).toBe(true)
    expect(shouldShowAppBanner(SAFARI, null, now)).toBe(false)
    expect(shouldShowAppBanner(DESKTOP, null, now)).toBe(false)
    expect(shouldShowAppBanner(ANDROID, '2026-11-20T12:00:00Z', now)).toBe(false)
    expect(shouldShowAppBanner(ANDROID, '2026-11-01T12:00:00Z', now)).toBe(true)
  })
})

// Where to get the DóndeTa app, and which store fits the visitor's phone.
// Pure, so it can be unit-tested.

export const APP_STORE_ID = '6835941043'
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.jfmcss.dondeta'

export type MobilePlatform = 'ios' | 'android'

export const APP_BANNER_DISMISSED_KEY = 'dondeta.appBanner.dismissedAt'
export const APP_BANNER_SNOOZE_DAYS = 14
const DAY_MS = 86_400_000

export function mobilePlatform(userAgent: string): MobilePlatform | null {
  if (/android/i.test(userAgent)) return 'android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios'
  return null
}

export function storeUrl(platform: MobilePlatform): string {
  return platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL
}

/** Plain iOS Safari already shows Apple's Smart App Banner (index.html meta tag). */
export function isIosSafari(userAgent: string): boolean {
  return mobilePlatform(userAgent) === 'ios'
    && /Safari\//.test(userAgent)
    && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|Instagram|FBAN|FBAV|Line\//.test(userAgent)
}

/** Our own banner: phones only, not where Safari's banner already shows, not right after a dismissal. */
export function shouldShowAppBanner(userAgent: string, dismissedAt: string | null, now = new Date()): boolean {
  if (!mobilePlatform(userAgent) || isIosSafari(userAgent)) return false
  if (dismissedAt) {
    const dismissed = Date.parse(dismissedAt)
    if (Number.isFinite(dismissed) && now.getTime() - dismissed < APP_BANNER_SNOOZE_DAYS * DAY_MS) return false
  }
  return true
}

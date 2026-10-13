import { useSyncExternalStore } from 'react'
import { Platform } from 'react-native'

type AdMobModule = typeof import('react-native-google-mobile-ads')

// Native module -- missing in Expo Go. A static import would throw before
// any of our code runs, so it's required inside try/catch; without it the
// app simply shows no ads.
let AdMob: AdMobModule | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AdMob = require('react-native-google-mobile-ads')
} catch {
  AdMob = null
}

export { AdMob }

// AdMob ad units (app ids live in app.json's plugin config). Dev builds always
// use Google's test units: tapping real ads from a dev build is invalid
// traffic and can get the AdMob account suspended.
const UNITS = {
  ios: { native: 'ca-app-pub-3955748382514121/6767303415', banner: 'ca-app-pub-3955748382514121/6424697641' },
  android: { native: 'ca-app-pub-3955748382514121/1236695005', banner: 'ca-app-pub-3955748382514121/1846149223' },
} as const

export function adUnit(format: 'native' | 'banner'): string | null {
  if (!AdMob) return null
  if (__DEV__) return format === 'native' ? AdMob.TestIds.NATIVE : AdMob.TestIds.ADAPTIVE_BANNER
  const units = Platform.OS === 'ios' ? UNITS.ios : Platform.OS === 'android' ? UNITS.android : null
  return units ? units[format] : null
}

// Shopping-related hints so AdMob serves ads that fit the app.
export const AD_KEYWORDS = ['electrodomésticos', 'tecnología', 'hogar', 'ofertas', 'República Dominicana']

// --- Initialization state, shared by every ad slot -------------------------

type AdsState = { ready: boolean; personalized: boolean }
let state: AdsState = { ready: false, personalized: false }
const listeners = new Set<() => void>()
const setState = (next: AdsState) => {
  state = next
  listeners.forEach(listener => listener())
}

let started = false

// Runs once at launch: asks for consent where required (AdMob's privacy
// message, then Apple's tracking prompt on iOS), then starts the SDK. Ads
// render only after this, and stay off if the user can't be shown ads.
export async function initAds() {
  if (started || !AdMob) return
  started = true
  const { default: mobileAds, AdsConsent, MaxAdContentRating } = AdMob
  try {
    const consent = await AdsConsent.gatherConsent().catch(() => null)
    if (consent && !consent.canRequestAds) return
    const choices = await AdsConsent.getUserChoices().catch(() => null)
    await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG })
    await mobileAds().initialize()
    setState({ ready: true, personalized: choices?.selectPersonalisedAds ?? false })
  } catch {
    // Ads are optional: never let them affect the app.
  }
}

export function useAds(): AdsState {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}

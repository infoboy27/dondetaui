import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'
import { countryFromRegion, isCountryCode, DEFAULT_COUNTRY, type CountryCode } from './countries'
import { setCurrentCountry } from './currentCountry'

const KEY = 'dondeta.country'

export interface CountryPreference {
  code: CountryCode
  /** Picked from the device region, not chosen by the user. */
  auto: boolean
  /** The device region isn't one we serve: ask once. */
  needsChoice: boolean
  /** The "showing products from X" banner was dismissed. */
  bannerDismissed: boolean
}

function deviceRegion(): string | null {
  try {
    return Localization.getLocales()[0]?.regionCode ?? null
  } catch {
    return null
  }
}

async function read(): Promise<Partial<CountryPreference> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<CountryPreference>) : null
  } catch {
    return null
  }
}

async function write(pref: CountryPreference) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(pref))
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
}

/** Resolves the country at startup: the saved choice, else the device region. */
export async function initCountry(): Promise<CountryPreference> {
  const saved = await read()
  let pref: CountryPreference
  if (saved && isCountryCode(saved.code)) {
    pref = { code: saved.code, auto: !!saved.auto, needsChoice: false, bannerDismissed: !!saved.bannerDismissed }
  } else {
    const detected = countryFromRegion(deviceRegion())
    pref = { code: detected ?? DEFAULT_COUNTRY, auto: detected !== null, needsChoice: detected === null, bannerDismissed: false }
    // An unsupported region isn't saved: the chooser decides.
    if (detected) await write(pref)
  }
  setCurrentCountry(pref.code)
  return pref
}

/** The user picked a country: switch to it and remember it. */
export async function chooseCountry(code: CountryCode): Promise<CountryPreference> {
  const pref: CountryPreference = { code, auto: false, needsChoice: false, bannerDismissed: true }
  await write(pref)
  setCurrentCountry(code)
  return pref
}

export async function dismissCountryBanner(code: CountryCode) {
  await write({ code, auto: true, needsChoice: false, bannerDismissed: true })
}

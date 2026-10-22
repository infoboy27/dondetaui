import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { chooseCountry, dismissCountryBanner, type CountryPreference } from '../config/countryStorage'
import type { CountryCode } from '../config/countries'

interface CountryState {
  pref: CountryPreference
  choose: (code: CountryCode) => Promise<void>
  dismissBanner: () => void
}

const CountryContext = createContext<CountryState | null>(null)

export function CountryProvider({ initial, children }: { initial: CountryPreference; children: ReactNode }) {
  const [pref, setPref] = useState(initial)

  const choose = useCallback(async (code: CountryCode) => {
    setPref(await chooseCountry(code))
  }, [])

  const dismissBanner = useCallback(() => {
    setPref(current => ({ ...current, bannerDismissed: true }))
    void dismissCountryBanner(pref.code)
  }, [pref.code])

  return <CountryContext.Provider value={{ pref, choose, dismissBanner }}>{children}</CountryContext.Provider>
}

export function useCountryPreference(): CountryState {
  const value = useContext(CountryContext)
  if (!value) throw new Error('useCountryPreference must be used inside CountryProvider')
  return value
}

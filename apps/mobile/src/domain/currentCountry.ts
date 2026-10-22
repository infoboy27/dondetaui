import { COUNTRIES, DEFAULT_COUNTRY, type Country, type CountryCode } from './countries'

// The country in use, readable synchronously from anywhere (API client, price
// formatting). Persistence lives in countryStorage.ts so this file stays pure.
let current: Country = COUNTRIES[DEFAULT_COUNTRY]
const listeners = new Set<() => void>()

export function getCountry(): Country {
  return current
}

export function setCurrentCountry(code: CountryCode) {
  if (current.code === code) return
  current = COUNTRIES[code]
  listeners.forEach(listener => listener())
}

export function subscribeCountry(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

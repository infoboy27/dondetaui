import { useSyncExternalStore } from 'react'
import { getCountry, subscribeCountry } from '../domain/currentCountry'

export function useCountry() {
  return useSyncExternalStore(subscribeCountry, getCountry, getCountry)
}

import { useSyncExternalStore } from 'react'
import { getCountry, subscribeCountry } from '../config/currentCountry'

export function useCountry() {
  return useSyncExternalStore(subscribeCountry, getCountry, getCountry)
}

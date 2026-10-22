import { getCountry } from '../domain/currentCountry'

// EXPO_PUBLIC_API_URL points every country at one backend (local development).
// Release builds leave it unset: the API follows the user's country.
const override = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')

export const appConfig = {
  get apiBaseUrl(): string {
    return override ?? getCountry().apiUrl
  },
}

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth, type AuthApi } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { usePriceAlerts } from '../hooks/usePriceAlerts'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { getCountry } from '../config/currentCountry'
import type { User } from '../types'

// Product ids belong to one country's backend, so guest favorites do too.
const GUEST_FAVORITES_KEY = getCountry().code === 'DO' ? 'dondeta.guestFavorites' : `dondeta.guestFavorites.${getCountry().code}`

interface AppState {
  user: User | null
  authLoading: boolean
  // Sign-in, 2FA, password and account actions (src/hooks/useAuth.ts).
  auth: AuthApi
  favoriteIds: Set<string>
  toggleFavorite: (productId: string) => void
  alertedIds: Set<string>
  // Returns false when the user isn't logged in (alerts require an account,
  // no guest concept -- caller should route to Perfil to sign in).
  toggleAlert: (productId: string) => boolean
}

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const { user, loading: authLoading } = auth
  const favorites = useFavorites(user)
  const priceAlerts = usePriceAlerts(user)
  usePushNotifications(user)
  const [guestFavoriteIds, setGuestFavoriteIds] = useState<Set<string>>(new Set())
  const guestLoaded = useRef(false)

  // Load persisted guest favorites once on mount -- mirrors the web app's
  // localStorage-backed guest favorites (src/App.tsx's readGuestFavorites).
  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(GUEST_FAVORITES_KEY)
        if (raw) setGuestFavoriteIds(new Set(JSON.parse(raw)))
      } catch { /* ignore malformed/unavailable storage */ }
      guestLoaded.current = true
    })()
  }, [])

  useEffect(() => {
    if (user || !guestLoaded.current) return
    void AsyncStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify([...guestFavoriteIds])).catch(() => {})
  }, [user, guestFavoriteIds])

  // Merge favorites collected while browsing as a guest into the account the
  // moment login/register succeeds, then clear the local copy -- same
  // behavior as the web app's App.tsx merge-on-login effect.
  useEffect(() => {
    if (!user || guestFavoriteIds.size === 0) return
    const idsToMerge = [...guestFavoriteIds]
    setGuestFavoriteIds(new Set())
    void AsyncStorage.removeItem(GUEST_FAVORITES_KEY).catch(() => {})
    for (const id of idsToMerge) void favorites.create(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const favoriteIds = user ? new Set(favorites.favorites.map(f => f.productId)) : guestFavoriteIds

  const toggleFavorite = (productId: string) => {
    if (user) {
      if (favoriteIds.has(productId)) {
        void favorites.remove(productId).then(() => priceAlerts.refresh()).catch(() => {})
      } else {
        // The API also creates the price alert for a saved product; resync the bell.
        void favorites.create(productId).then(() => priceAlerts.refresh()).catch(() => {})
      }
      return
    }
    setGuestFavoriteIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const alertedIds = new Set(priceAlerts.alerts.map(a => a.productId))

  const toggleAlert = (productId: string): boolean => {
    if (!user) return false
    if (alertedIds.has(productId)) void priceAlerts.remove(productId)
    else void priceAlerts.create(productId)
    return true
  }

  const value: AppState = {
    user,
    authLoading,
    auth,
    favoriteIds,
    toggleFavorite,
    alertedIds,
    toggleAlert,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used within an AppStateProvider')
  return context
}

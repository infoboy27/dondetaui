import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import type { User } from '../types'

const GUEST_FAVORITES_KEY = 'dondeta.guestFavorites'

interface AppState {
  user: User | null
  authLoading: boolean
  authError: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
  favoriteIds: Set<string>
  toggleFavorite: (productId: string) => void
}

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, error: authError, login, register, logout } = useAuth()
  const favorites = useFavorites(user)
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
      if (favoriteIds.has(productId)) void favorites.remove(productId)
      else void favorites.create(productId)
      return
    }
    setGuestFavoriteIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const value: AppState = {
    user,
    authLoading,
    authError,
    login,
    register,
    logout,
    favoriteIds,
    toggleFavorite,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used within an AppStateProvider')
  return context
}

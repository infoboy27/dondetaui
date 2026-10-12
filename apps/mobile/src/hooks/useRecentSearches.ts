import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'dondeta.recentSearches'
const MAX = 8

// The last few searches, newest first, kept on the device only.
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { if (raw) setRecent(JSON.parse(raw)) })
      .catch(() => {})
  }, [])

  const persist = (next: string[]) => {
    void AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {})
    return next
  }

  const add = useCallback((term: string) => {
    const value = term.trim()
    if (value.length < 2) return
    setRecent(prev => persist([value, ...prev.filter(t => t.toLowerCase() !== value.toLowerCase())].slice(0, MAX)))
  }, [])

  const clear = useCallback(() => {
    setRecent(persist([]))
  }, [])

  return { recent, add, clear }
}

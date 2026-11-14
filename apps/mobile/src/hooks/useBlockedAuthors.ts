import { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { reviewsApi } from '../api/reviews'
import { addBlocked, parseBlocked } from '../domain/reviewBlocks'

const KEY = 'dondeta.blockedReviewAuthors'

// Authors whose reviews this reader hid. On the phone always; on the server
// too when signed in, so the web and the app agree.
export function useBlockedAuthors(signedIn: boolean) {
  const [keys, setKeys] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    AsyncStorage.getItem(KEY)
      .then(raw => { if (alive) setKeys(current => parseBlocked(raw).reduce(addBlocked, current)) })
      .catch(() => {})
    if (signedIn) {
      reviewsApi.blockedAuthors()
        .then(remote => { if (alive) setKeys(current => remote.reduce(addBlocked, current)) })
        .catch(() => {})
    }
    return () => { alive = false }
  }, [signedIn])

  const hideAuthor = useCallback((authorKey: string) => {
    setKeys(current => {
      const next = addBlocked(current, authorKey)
      void AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {})
      return next
    })
    if (signedIn) void reviewsApi.blockAuthor(authorKey).catch(() => {})
  }, [signedIn])

  const blocked = useMemo(() => new Set(keys), [keys])
  return { blocked, hideAuthor }
}

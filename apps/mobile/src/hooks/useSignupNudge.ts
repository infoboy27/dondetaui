import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { shouldShowNudge } from '../domain/signupNudge'

// Local flags for the Home "Crea tu cuenta" card (src/domain/signupNudge.ts).
// Storage failures just hide the card: it is never worth an error.
const DISMISSED_KEY = 'dondeta.signupNudge.dismissedAt'
const SIGNED_UP_KEY = 'dondeta.signupNudge.signedUp'

export async function markSignedUp(): Promise<void> {
  await AsyncStorage.setItem(SIGNED_UP_KEY, '1').catch(() => {})
}

export function useSignupNudge(signedIn: boolean) {
  const [state, setState] = useState<{ dismissedAt: number | null; hasSignedUp: boolean } | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([AsyncStorage.getItem(DISMISSED_KEY), AsyncStorage.getItem(SIGNED_UP_KEY)])
      .then(([dismissed, signedUp]) => {
        if (alive) setState({ dismissedAt: dismissed ? Number(dismissed) || null : null, hasSignedUp: signedUp === '1' })
      })
      .catch(() => { if (alive) setState({ dismissedAt: Date.now(), hasSignedUp: false }) })
    return () => { alive = false }
  }, [])

  const dismiss = useCallback(() => {
    const at = Date.now()
    setState(prev => ({ hasSignedUp: prev?.hasSignedUp ?? false, dismissedAt: at }))
    void AsyncStorage.setItem(DISMISSED_KEY, String(at)).catch(() => {})
  }, [])

  const visible = state !== null && shouldShowNudge({ signedIn, ...state })
  return { visible, dismiss }
}

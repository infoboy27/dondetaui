import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { promoPushApi } from '../api/pushToken'
import { parsePromoPref, shouldShowPromoCard, type PromoPref } from '../domain/promoPush'
import { Notifications, PROMOS_CHANNEL, pushSupported } from '../notifications/expoNotifications'

const PREF_KEY = 'dondeta.promoPush'
const DISMISSED_KEY = 'dondeta.promoPush.cardDismissedAt'

export interface PromoPushApi {
  supported: boolean
  // This device receives "Ofertas y recordatorios".
  enabled: boolean
  // Home card: shown until the person turns it on, off, or closes it.
  cardVisible: boolean
  dismissCard: () => void
  // Perfil switch and the card's button. Asks the OS for permission if needed.
  setEnabled: (on: boolean) => Promise<void>
}

function projectId(): string | undefined {
  const fromConfig = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
  return fromConfig ?? Constants.easConfig?.projectId
}

// Promotional pushes (Guideline 4.5.4): off until the person opts in, with or
// without an account; the consent belongs to this device. iPhone and Android.
export function usePromoPush(): PromoPushApi {
  const [pref, setPrefState] = useState<PromoPref>('unset')
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [desired, setDesired] = useState<boolean | null>(null)
  const prefRef = useRef<PromoPref>('unset')

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(PREF_KEY), AsyncStorage.getItem(DISMISSED_KEY)])
      .then(([rawPref, rawDismissed]) => {
        prefRef.current = parsePromoPref(rawPref)
        setPrefState(prefRef.current)
        setDismissedAt(rawDismissed ? Number(rawDismissed) || null : null)
      })
      .catch(() => setDismissedAt(Date.now()))
      .finally(() => setLoaded(true))
  }, [])

  const savePref = (next: PromoPref) => {
    prefRef.current = next
    setPrefState(next)
    void AsyncStorage.setItem(PREF_KEY, next).catch(() => {})
  }

  const currentToken = useCallback(async (): Promise<string | null> => {
    const notifications = Notifications
    const id = projectId()
    if (!notifications || !id) return null
    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync(PROMOS_CHANNEL, {
        name: 'Ofertas y recordatorios',
        importance: notifications.AndroidImportance.DEFAULT,
      })
    }
    const { data } = await notifications.getExpoPushTokenAsync({ projectId: id })
    return data
  }, [])

  const platform = Platform.OS === 'ios' ? 'ios' : 'android'

  // Opted in and permission still granted: refresh the token on launch and
  // when coming back from Settings, so the server keeps a working one.
  const resync = useCallback(async () => {
    const notifications = Notifications
    if (!pushSupported || !notifications || prefRef.current !== 'on') return
    try {
      const permission = await notifications.getPermissionsAsync()
      if (!permission.granted) return
      const token = await currentToken()
      if (token) await promoPushApi.set(token, platform, true)
    } catch {
      /* offline: next launch */
    }
  }, [currentToken, platform])

  useEffect(() => { if (loaded) void resync() }, [loaded, resync])
  useEffect(() => {
    if (!pushSupported) return
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void resync() })
    return () => subscription.remove()
  }, [resync])

  const setEnabled = useCallback(async (on: boolean) => {
    const notifications = Notifications
    if (!pushSupported || !notifications) return
    setDesired(on)
    try {
      if (!on) {
        savePref('off')
        const token = await currentToken().catch(() => null)
        if (token) await promoPushApi.set(token, platform, false).catch(() => {})
        return
      }
      let permission = await notifications.getPermissionsAsync()
      if (!permission.granted && permission.canAskAgain) permission = await notifications.requestPermissionsAsync()
      if (!permission.granted) {
        // Blocked in the phone's settings: send the person there.
        if (!permission.canAskAgain) await Linking.openSettings()
        return
      }
      const token = await currentToken()
      if (!token) return
      await promoPushApi.set(token, platform, true)
      savePref('on')
    } catch {
      /* no network: the switch goes back, they can try again */
    } finally {
      setDesired(null)
    }
  }, [currentToken, platform])

  const dismissCard = useCallback(() => {
    const at = Date.now()
    setDismissedAt(at)
    void AsyncStorage.setItem(DISMISSED_KEY, String(at)).catch(() => {})
  }, [])

  return {
    supported: pushSupported,
    enabled: desired ?? pref === 'on',
    cardVisible: loaded && shouldShowPromoCard({ supported: pushSupported, pref, dismissedAt }),
    dismissCard,
    setEnabled,
  }
}

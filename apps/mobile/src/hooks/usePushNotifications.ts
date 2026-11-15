import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { pushTokenApi } from '../api/pushToken'
import { decidePushAction, parsePushPref, type PushPermission, type PushPref, type PushTrigger } from '../domain/pushPrefs'
import { Notifications, PRICE_ALERTS_CHANNEL, pushSupported } from '../notifications/expoNotifications'
import type { User } from '../types'

const PREF_KEY = 'dondeta.pushPref'
const TOKEN_KEY = 'dondeta.pushToken'

export interface PushApi {
  // false in Expo Go and on simulators: the Perfil switch is hidden.
  supported: boolean
  // This device receives price-drop pushes for the signed-in account.
  enabled: boolean
  // Call when the user follows a product (saves it or turns on its alert):
  // the first time, that is when we ask for permission.
  onFollow: () => void
  // The Perfil switch.
  setEnabled: (on: boolean) => Promise<void>
  // Removes this device from the account; call before signing out.
  unregister: () => Promise<void>
}

function projectId(): string | undefined {
  const fromConfig = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
  return fromConfig ?? Constants.easConfig?.projectId
}

// Price-drop push for the signed-in user. Permission is never requested on
// launch or sign-in, only when the user follows something or turns the switch
// on (decidePushAction). No-op under Expo Go or on simulators.
export function usePushNotifications(user: User | null): PushApi {
  const [pref, setPrefState] = useState<PushPref>('unset')
  const prefRef = useRef<PushPref>('unset')
  const [prefLoaded, setPrefLoaded] = useState(false)
  const [registered, setRegistered] = useState(false)
  // The switch position while a toggle is in flight (no flicker back).
  const [desired, setDesired] = useState<boolean | null>(null)
  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => {
    void AsyncStorage.getItem(PREF_KEY)
      .then(raw => { prefRef.current = parsePushPref(raw); setPrefState(prefRef.current) })
      .catch(() => {})
      .finally(() => setPrefLoaded(true))
  }, [])

  const setPref = (next: PushPref) => {
    prefRef.current = next
    setPrefState(next)
    void AsyncStorage.setItem(PREF_KEY, next).catch(() => {})
  }

  const registerToken = useCallback(async () => {
    const notifications = Notifications
    const id = projectId()
    if (!notifications || !id || !userRef.current) return
    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync(PRICE_ALERTS_CHANNEL, {
        name: 'Alertas de precio',
        importance: notifications.AndroidImportance.HIGH,
      })
    }
    const { data: token } = await notifications.getExpoPushTokenAsync({ projectId: id })
    if (!userRef.current) return
    await pushTokenApi.register(token, Platform.OS === 'ios' ? 'ios' : 'android')
    await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {})
    setRegistered(true)
  }, [])

  const run = useCallback(async (trigger: PushTrigger) => {
    const notifications = Notifications
    if (!pushSupported || !notifications || !userRef.current) return
    try {
      const current = await notifications.getPermissionsAsync()
      const permission: PushPermission = current.granted ? 'granted' : current.status === 'denied' ? 'denied' : 'undetermined'
      const action = decidePushAction({ trigger, pref: prefRef.current, permission, canAskAgain: current.canAskAgain })
      if (action === 'skip') {
        if (permission !== 'granted') setRegistered(false)
        return
      }
      if (action === 'openSettings') {
        await Linking.openSettings()
        return
      }
      if (action === 'ask') {
        const answer = await notifications.requestPermissionsAsync()
        if (!answer.granted) return
      }
      await registerToken()
    } catch {
      /* no network / no push capability: try again next time */
    }
  }, [registerToken])

  const unregister = useCallback(async () => {
    setRegistered(false)
    const token = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null)
    if (!token) return
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {})
    if (userRef.current) await pushTokenApi.unregister(token).catch(() => {})
  }, [])

  // Signed in (or app opened with a session): refresh the token if allowed.
  useEffect(() => {
    if (!prefLoaded) return
    if (!user) {
      setRegistered(false)
      return
    }
    void run('signin')
  }, [user, prefLoaded, run])

  // Back from Settings (permission turned on/off there): resync quietly.
  useEffect(() => {
    if (!pushSupported) return
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && userRef.current) void run('signin')
    })
    return () => subscription.remove()
  }, [run])

  const onFollow = useCallback(() => { void run('follow') }, [run])

  const setEnabled = useCallback(async (on: boolean) => {
    setDesired(on)
    try {
      if (on) {
        setPref('on')
        await run('enable')
      } else {
        setPref('off')
        await unregister()
      }
    } finally {
      setDesired(null)
    }
  }, [run, unregister])

  return {
    supported: pushSupported,
    enabled: desired ?? (!!user && pref !== 'off' && registered),
    onFollow,
    setEnabled,
    unregister,
  }
}

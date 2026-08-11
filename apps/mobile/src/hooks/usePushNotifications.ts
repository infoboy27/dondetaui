import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { pushTokenApi } from '../api/pushToken'
import type { User } from '../types'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Registers this device for price-drop push notifications once the user is
// logged in (the backend needs a userId to send to) and unregisters on
// logout. Remote push doesn't work inside Expo Go (Expo removed that in
// SDK 53+) -- this only does anything in a real dev/production build.
export function usePushNotifications(user: User | null) {
  const registeredToken = useRef<string | null>(null)

  useEffect(() => {
    if (!user || !Device.isDevice) return
    let cancelled = false

    void (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync()
      let status = existing
      if (status !== 'granted') {
        const request = await Notifications.requestPermissionsAsync()
        status = request.status
      }
      if (status !== 'granted' || cancelled) return

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        })
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      if (!projectId) return

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
        if (cancelled) return
        registeredToken.current = token
        await pushTokenApi.register(token, Platform.OS === 'ios' ? 'ios' : 'android')
      } catch {
        /* Expo Go / simulators without push capability -- silently skip */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (user || !registeredToken.current) return
    const token = registeredToken.current
    registeredToken.current = null
    void pushTokenApi.unregister(token).catch(() => {})
  }, [user])
}

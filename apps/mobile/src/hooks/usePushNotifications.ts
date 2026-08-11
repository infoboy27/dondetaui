import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { pushTokenApi } from '../api/pushToken'
import type { User } from '../types'

type NotificationsModule = typeof import('expo-notifications')
type DeviceModule = typeof import('expo-device')

// Remote push doesn't work inside Expo Go (Expo removed that in SDK 53+):
// merely evaluating a static `import ... from 'expo-notifications'` throws
// there, before any of our own code runs. A static import is hoisted, so no
// try/catch placed after it can ever catch that -- only a plain `require()`
// call, as a normal statement, can be wrapped. This must stay `require`,
// not `import`, for that reason.
let Notifications: NotificationsModule | null = null
let Device: DeviceModule | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Device = require('expo-device')
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
} catch {
  Notifications = null
  Device = null
}

// Registers this device for price-drop push notifications once the user is
// logged in (the backend needs a userId to send to) and unregisters on
// logout. No-op under Expo Go (see above) or on simulators.
export function usePushNotifications(user: User | null) {
  const registeredToken = useRef<string | null>(null)

  useEffect(() => {
    const notifications = Notifications
    const device = Device
    if (!user || !notifications || !device?.isDevice) return
    let cancelled = false

    void (async () => {
      try {
        const { status: existing } = await notifications.getPermissionsAsync()
        let status = existing
        if (status !== 'granted') {
          const request = await notifications.requestPermissionsAsync()
          status = request.status
        }
        if (status !== 'granted' || cancelled) return

        if (Platform.OS === 'android') {
          await notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: notifications.AndroidImportance.DEFAULT,
          })
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId
        if (!projectId) return

        const { data: token } = await notifications.getExpoPushTokenAsync({ projectId })
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

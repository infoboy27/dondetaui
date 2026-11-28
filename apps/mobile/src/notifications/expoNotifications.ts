type NotificationsModule = typeof import('expo-notifications')
type DeviceModule = typeof import('expo-device')

// Remote push doesn't work inside Expo Go (Expo removed that in SDK 53+):
// merely evaluating a static `import ... from 'expo-notifications'` throws
// there, before any of our own code runs. A static import is hoisted, so no
// try/catch placed after it can ever catch that -- only a plain `require()`
// call, as a normal statement, can be wrapped. This must stay `require`,
// not `import`, for that reason. Everything else imports from this file.
let notifications: NotificationsModule | null = null
let device: DeviceModule | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  notifications = require('expo-notifications') as NotificationsModule
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  device = require('expo-device') as DeviceModule
  // A price-drop push that arrives while the app is open still shows a banner.
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
} catch {
  notifications = null
  device = null
}

export const Notifications = notifications

// Push needs the native module and a real device (not a simulator/emulator).
export const pushSupported = !!notifications && !!device?.isDevice

// Same id the API sends in channelId (apps/api push messages).
export const PRICE_ALERTS_CHANNEL = 'price-alerts'

// Android channel for "Ofertas y recordatorios" (apps/api PROMOS_CHANNEL).
export const PROMOS_CHANNEL = 'promos'

import { useEffect } from 'react'
import { router } from 'expo-router'
import { notificationPath } from '../domain/pushPrefs'
import { Notifications } from '../notifications/expoNotifications'

// Tapping a price-drop push opens its product (data.url, mapped through the
// same deep-link table as universal links). Covers both a running app and a
// cold start from the notification. Mount once, below the root Stack.
export function useNotificationTaps() {
  useEffect(() => {
    const notifications = Notifications
    if (!notifications) return
    let handled: string | null = null

    const open = (response: { notification: { request: { identifier: string; content: { data?: unknown } } } } | null) => {
      if (!response) return
      const id = response.notification.request.identifier
      if (id === handled) return
      handled = id
      const path = notificationPath(response.notification.request.content.data)
      if (path) router.push(path as never)
      // Don't reopen it the next time the app mounts.
      void notifications.clearLastNotificationResponseAsync().catch(() => {})
    }

    void notifications.getLastNotificationResponseAsync().then(open).catch(() => {})
    const subscription = notifications.addNotificationResponseReceivedListener(open)
    return () => subscription.remove()
  }, [])
}

export function NotificationTapHandler() {
  useNotificationTaps()
  return null
}

// When the app may ask for notification permission and register the push
// token, and where a tapped notification leads. Pure, tested
// (pushPrefs.test.ts); the side effects live in hooks/usePushNotifications.ts.
import { appPathFor } from './deepLinks'

// The user's choice in Perfil → Notificaciones, stored on the device.
// 'unset' = never chose: we ask the first time they follow something.
export type PushPref = 'on' | 'off' | 'unset'
export type PushPermission = 'granted' | 'denied' | 'undetermined'

// signin: the app opened with a session / the user just signed in.
// follow: the user saved a product or turned on its price alert.
// enable: the user turned the switch on in Perfil.
export type PushTrigger = 'signin' | 'follow' | 'enable'

export type PushAction = 'register' | 'ask' | 'openSettings' | 'skip'

export interface PushContext {
  trigger: PushTrigger
  pref: PushPref
  permission: PushPermission
  // false once the OS won't show the prompt again (iOS after one answer).
  canAskAgain: boolean
}

export function decidePushAction({ trigger, pref, permission, canAskAgain }: PushContext): PushAction {
  if (trigger === 'enable') {
    if (permission === 'granted') return 'register'
    return canAskAgain ? 'ask' : 'openSettings'
  }
  if (pref === 'off') return 'skip'
  if (permission === 'granted') return 'register'
  // Never prompt on launch or sign-in: only when following gives it a reason.
  if (trigger === 'signin') return 'skip'
  // Someone who already said no isn't nagged on every follow.
  return permission === 'undetermined' && canAskAgain ? 'ask' : 'skip'
}

export function parsePushPref(raw: string | null | undefined): PushPref {
  return raw === 'on' || raw === 'off' ? raw : 'unset'
}

// The app screen for a tapped notification (data.url set by the API, e.g.
// "/product/<slug>"), or null when it has nowhere specific to go.
export function notificationPath(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const url = (data as Record<string, unknown>).url
  if (typeof url !== 'string' || !url.trim()) return null
  const path = appPathFor(url.trim())
  return path === '/' ? null : path
}

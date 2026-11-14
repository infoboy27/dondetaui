// "Crea tu cuenta" card on Home for signed-out users (the app's version of
// the web's first-visit prompt, src/domain/signupPrompt.ts). Pure, tested.
import { blackFridayBanner } from './blackFriday'

export const NUDGE_SNOOZE_DAYS = 14
const DAY_MS = 86_400_000

export interface NudgeState {
  signedIn: boolean
  /** ms epoch of the last "Ahora no", or null. */
  dismissedAt: number | null
  /** The user has created an account on this phone before. */
  hasSignedUp: boolean
}

export function shouldShowNudge(state: NudgeState, now = Date.now()): boolean {
  if (state.signedIn || state.hasSignedUp) return false
  if (state.dismissedAt !== null && now - state.dismissedAt < NUDGE_SNOOZE_DAYS * DAY_MS) return false
  return true
}

export interface NudgeCopy {
  title: string
  text: string
  /** Where the button goes: the BF sign-up screen or plain registration. */
  target: 'black-friday' | 'register'
}

// Black Friday copy while the home banner is up (45 days before through
// Cyber Monday) and only for the Dominican stack, which sends the emails.
export function nudgeCopy(countryCode: string, now = new Date()): NudgeCopy {
  if (countryCode === 'DO' && blackFridayBanner(now)) {
    return {
      title: 'Te avisamos solo de las ofertas reales',
      text: 'Crea tu cuenta gratis y te llega por correo lo que de verdad bajó en Black Friday.',
      target: 'black-friday',
    }
  }
  return {
    title: 'Crea tu cuenta gratis',
    text: 'Te avisamos cuando baje el precio de lo que te interesa, y tus favoritos se guardan en la web.',
    target: 'register',
  }
}

// RegisterDto.source: a query string the API whitelists
// (apps/api/src/auth/signup-alert.ts parseSignupSource).
export function appSignupSource(platform: string, landing?: string): string {
  const params = new URLSearchParams({ utm_source: 'app', utm_medium: platform === 'ios' ? 'ios' : 'android' })
  if (landing) params.set('landing', landing.slice(0, 120))
  return params.toString()
}

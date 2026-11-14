// Mirror of src/domain/signupPrompt.ts (the web app) for the server-rendered
// pages; keep both in sync. Both apps share the dondeta.com.do origin, so the
// storage keys (and the SPA's auth token key) are the same.
import { blackFriday } from './blackFriday'

export const PROMPT_DISMISSED_KEY = 'dondeta.signupPrompt.dismissedAt'
export const PROMPT_DONE_KEY = 'dondeta.signupPrompt.done'
export const SIGNUP_SOURCE_KEY = 'dondeta.signupSource'
export const AUTH_TOKEN_KEY = 'dondeta.authToken'

export const PROMPT_DELAY_MS = 10_000
export const PROMPT_SCROLL_RATIO = 0.5
export const PROMPT_SNOOZE_DAYS = 14
const DAY_MS = 86_400_000
const BF_LEAD_DAYS = 45
const BF_AFTER_DAYS = 3

const EXCLUDED_PREFIXES = ['/cuenta', '/admin', '/ig-render', '/login', '/auth', '/profile']

export interface PromptState {
  pathname: string
  search: string
  signedIn: boolean
  dismissedAt: string | null
  done: boolean
  now?: Date
}

export function shouldShowSignupPrompt(state: PromptState): boolean {
  if (state.signedIn || state.done) return false
  const path = state.pathname.toLowerCase()
  if (EXCLUDED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return false
  if (new URLSearchParams(state.search).has('activar')) return false
  if (state.dismissedAt) {
    const dismissed = Date.parse(state.dismissedAt)
    const now = (state.now ?? new Date()).getTime()
    if (Number.isFinite(dismissed) && now - dismissed < PROMPT_SNOOZE_DAYS * DAY_MS) return false
  }
  return true
}

export interface PromptCopy {
  kind: 'black-friday' | 'alerts'
  title: string
  body: string
  cta: string
  href: string
}

export function signupPromptCopy(now = new Date(), blackFridayDigest = true): PromptCopy {
  const year = now.getUTCFullYear()
  const today = Date.UTC(year, now.getUTCMonth(), now.getUTCDate())
  const days = Math.round((blackFriday(year).getTime() - today) / DAY_MS)
  if (blackFridayDigest && days <= BF_LEAD_DAYS && days >= -BF_AFTER_DAYS) {
    return {
      kind: 'black-friday',
      title: 'Te avisamos solo de las ofertas reales de Black Friday',
      body: 'Comparamos cada precio con sus últimos 30 días. Si subió antes de “bajar”, no te llega.',
      cta: 'Crea tu cuenta gratis',
      href: `/cuenta/black-friday?activar=1&utm_source=web&utm_medium=popup&utm_campaign=black-friday-${year}`,
    }
  }
  return {
    kind: 'alerts',
    title: 'Crea tu cuenta gratis',
    body: 'Y te avisamos cuando baje el precio de lo que te interesa.',
    cta: 'Crear cuenta',
    href: '/login?registro=1&utm_source=web&utm_medium=popup&utm_campaign=signup',
  }
}

export function buildSignupSource(url: string, referrer: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return ''
  }
  const out = new URLSearchParams()
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = parsed.searchParams.get(key)
    if (value) out.set(key, value.slice(0, 60))
  }
  out.set('landing', parsed.pathname.slice(0, 120))
  try {
    const ref = referrer ? new URL(referrer).hostname : ''
    if (ref && ref !== parsed.hostname) out.set('ref', ref.slice(0, 60))
  } catch {
    /* not a URL: no referrer */
  }
  return out.toString()
}

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

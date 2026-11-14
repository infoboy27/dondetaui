// Discord message for every new account (DISCORD_WEBHOOK_SIGNUPS). Plain
// module, no Nest imports, so the root vitest run can test it.
import { maskEmail } from './codes'

export interface SignupSource {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  landing?: string
  ref?: string
}

const clean = (value: string | null, max: number) => value?.replace(/[^\p{L}\p{N}\-_./:?=&%]/gu, '').slice(0, max) || undefined

// The client sends first-touch attribution as a query string (see
// src/domain/signupPrompt.ts buildSignupSource). Untrusted: whitelisted keys,
// safe characters only, short.
export function parseSignupSource(raw: string | undefined | null): SignupSource {
  if (!raw) return {}
  let params: URLSearchParams
  try {
    params = new URLSearchParams(raw.slice(0, 500))
  } catch {
    return {}
  }
  const source: SignupSource = {
    utmSource: clean(params.get('utm_source'), 60),
    utmMedium: clean(params.get('utm_medium'), 60),
    utmCampaign: clean(params.get('utm_campaign'), 60),
    landing: clean(params.get('landing'), 120),
    ref: clean(params.get('ref'), 60),
  }
  return Object.fromEntries(Object.entries(source).filter(([, v]) => v)) as SignupSource
}

export function describeSource(source: SignupSource): string {
  const parts: string[] = []
  const utm = [source.utmSource, source.utmMedium, source.utmCampaign].filter(Boolean).join(' / ')
  if (utm) parts.push(utm)
  if (source.landing) parts.push(`entró por ${source.landing}`)
  if (source.ref) parts.push(`desde ${source.ref}`)
  return parts.join(' · ') || 'directo'
}

export function signupMessage(input: { email: string; source: SignupSource; totalUsers: number | null }): string {
  const lines = [
    '🆕 Nuevo registro en DóndeTa',
    `• Cuenta: ${maskEmail(input.email)}`,
    `• Origen: ${describeSource(input.source)}`,
  ]
  if (input.source.landing?.startsWith('/cuenta/black-friday')) lines.push('• Vino a suscribirse a las ofertas de Black Friday')
  if (input.totalUsers !== null) lines.push(`• Total de cuentas: ${input.totalUsers.toLocaleString('en-US')}`)
  return lines.join('\n')
}

export function digestSubscribedMessage(email: string, topic: string): string {
  return `📩 ${maskEmail(email)} se suscribió a las ofertas de ${topic === 'black-friday' ? 'Black Friday' : topic}`
}

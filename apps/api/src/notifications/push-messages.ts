// Pure helpers for Expo push (no Nest / pg imports: the root vitest suite runs
// these tests before apps/api's dependencies are installed in CI).
// Protocol: https://docs.expo.dev/push-notifications/sending-notifications/

export const EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send'
export const EXPO_PUSH_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts'
// Expo's limits: 100 messages per send request, 1000 ids per receipts request.
export const SEND_BATCH_SIZE = 100
export const RECEIPTS_BATCH_SIZE = 1000
// Price-drop pushes a single user can get from one alerts-worker run (every
// 30 min). Email still lists every drop; the phone shouldn't buzz ten times.
export const MAX_PRICE_DROP_PUSHES_PER_USER_PER_RUN = 3

export interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, string>
  sound?: 'default'
  channelId?: string
}

export type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message?: string; details?: { error?: string; expoPushToken?: string } }

export type ExpoPushReceipt =
  | { status: 'ok' }
  | { status: 'error'; message?: string; details?: { error?: string } }

export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token)
}

/** PUSH_NOTIFICATIONS_ENABLED=1 turns automatic price-drop pushes on (off by default). */
export function pushEnabled(env: Record<string, string | undefined>): boolean {
  const value = (env.PUSH_NOTIFICATIONS_ENABLED ?? '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes'
}

export function expoHeaders(accessToken: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  return headers
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error('chunk size must be >= 1')
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

export interface PriceDropPushInput {
  productName: string
  newPrice: string
  previousPrice?: string
  pct?: number
  slug: string | null
}

const MAX_NAME_LENGTH = 80

/** Title, body and deep link for a price-drop push. data.url is an app path (see apps/mobile deepLinks). */
export function buildPriceDropPush(input: PriceDropPushInput): Pick<ExpoPushMessage, 'title' | 'body' | 'data'> {
  const name = input.productName.length > MAX_NAME_LENGTH
    ? `${input.productName.slice(0, MAX_NAME_LENGTH - 1).trimEnd()}…`
    : input.productName
  const title = input.pct && input.pct > 0 ? `Bajó de precio (−${input.pct} %)` : 'Bajó de precio'
  const body = input.previousPrice
    ? `${name}: ahora ${input.newPrice} (antes ${input.previousPrice}).`
    : `${name}: ahora ${input.newPrice}.`
  const data: Record<string, string> = { type: 'price-drop' }
  if (input.slug) data.url = `/product/${encodeURIComponent(input.slug)}`
  return { title, body, data }
}

export function priceDropPct(previousPrice: number | undefined, newPrice: number): number | undefined {
  if (!previousPrice || previousPrice <= newPrice) return undefined
  return Math.round((1 - newPrice / previousPrice) * 100)
}

/** Keeps only valid, distinct Expo tokens. */
export function sendableTokens(tokens: string[]): string[] {
  return [...new Set(tokens.filter(isExpoPushToken))]
}

export interface TicketOutcome {
  /** ticket id -> token, to check its receipt on a later run */
  pending: { id: string; token: string }[]
  /** tokens Expo already rejected as not registered */
  disable: string[]
}

/**
 * Tickets come back in the same order as the messages sent. An error ticket
 * with DeviceNotRegistered means the token is dead right away; ok tickets
 * still need their receipt checked later.
 */
export function classifyTickets(messages: Pick<ExpoPushMessage, 'to'>[], tickets: ExpoPushTicket[]): TicketOutcome {
  const pending: TicketOutcome['pending'] = []
  const disable = new Set<string>()
  tickets.forEach((ticket, index) => {
    const token = messages[index]?.to
    if (!token) return
    if (ticket.status === 'ok') {
      if (ticket.id) pending.push({ id: ticket.id, token })
    } else if (ticket.details?.error === 'DeviceNotRegistered') {
      disable.add(ticket.details.expoPushToken ?? token)
    }
  })
  return { pending, disable: [...disable] }
}

/** Tokens to disable after reading receipts; `ids` maps ticket id -> token. */
export function tokensToDisableFromReceipts(
  ids: { id: string; token: string }[],
  receipts: Record<string, ExpoPushReceipt | undefined>,
): string[] {
  const disable = new Set<string>()
  for (const { id, token } of ids) {
    const receipt = receipts[id]
    if (receipt?.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') disable.add(token)
  }
  return [...disable]
}

/** Per-user cap of price-drop pushes within a run. */
export class PushBudget {
  private readonly sent = new Map<string, number>()

  constructor(private readonly max = MAX_PRICE_DROP_PUSHES_PER_USER_PER_RUN) {}

  take(userKey: string): boolean {
    const used = this.sent.get(userKey) ?? 0
    if (used >= this.max) return false
    this.sent.set(userKey, used + 1)
    return true
  }
}

// Manual broadcasts from /admin/notificaciones (and broadcast-push.cli).
// iOS shows ~40 characters of title and ~120 of body on the lock screen
// before cutting; the hard caps below leave room for longer text when needed.
export const BROADCAST_TITLE_MAX = 65
export const BROADCAST_BODY_MAX = 178

export interface BroadcastInput { title: string; body: string }

/** Trims and validates a broadcast; throws a Spanish message for the admin. */
export function parseBroadcast(raw: { title?: unknown; body?: unknown }): BroadcastInput {
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const body = typeof raw.body === 'string' ? raw.body.trim() : ''
  if (!title) throw new Error('Escribe un título')
  if (!body) throw new Error('Escribe el mensaje')
  if ([...title].length > BROADCAST_TITLE_MAX) throw new Error(`El título no puede pasar de ${BROADCAST_TITLE_MAX} caracteres`)
  if ([...body].length > BROADCAST_BODY_MAX) throw new Error(`El mensaje no puede pasar de ${BROADCAST_BODY_MAX} caracteres`)
  return { title, body }
}

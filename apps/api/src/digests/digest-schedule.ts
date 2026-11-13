import { randomBytes } from 'node:crypto'

// When the "ofertas reales de Black Friday" digest goes out. Pure, so the
// dates are unit-tested; the sender is send-deal-digest.cli.ts.
//
// Three send days -- the Wednesday before Black Friday (stores start early),
// Black Friday itself and Cyber Monday -- never before 09:00 Dominican time
// (UTC-4, no daylight saving). The sender runs every alerts cycle (30 min) and
// last_sent_on keeps it to one email per subscriber per day.

export const DIGEST_TOPICS = ['black-friday'] as const
export type DigestTopic = (typeof DIGEST_TOPICS)[number]

export function isDigestTopic(value: string): value is DigestTopic {
  return (DIGEST_TOPICS as readonly string[]).includes(value)
}

const RD_OFFSET_MS = 4 * 60 * 60 * 1000
const SEND_FROM_HOUR = 9

// Day after the 4th Thursday of November, as a UTC calendar date (ms).
export function blackFridayUtc(year: number): number {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay()
  const firstThursday = 1 + ((4 - first + 7) % 7)
  return Date.UTC(year, 10, firstThursday + 22)
}

export interface DigestSlot {
  /** Dominican calendar date (YYYY-MM-DD), stored as last_sent_on. */
  day: string
  /** Name used in the subject line. */
  eventName: string
}

export function digestSlot(now = new Date()): DigestSlot | null {
  const local = new Date(now.getTime() - RD_OFFSET_MS)
  if (local.getUTCHours() < SEND_FROM_HOUR) return null
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  const offset = Math.round((today - blackFridayUtc(local.getUTCFullYear())) / 86_400_000)
  const eventName = offset === -2 ? 'Black Friday se adelanta' : offset === 0 ? 'Black Friday' : offset === 3 ? 'Cyber Monday' : null
  if (!eventName) return null
  return { day: new Date(today).toISOString().slice(0, 10), eventName }
}

export function newUnsubscribeToken(): string {
  return randomBytes(24).toString('hex')
}

export function isWellFormedToken(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-f]{48}$/.test(token)
}

const SITE = 'https://dondeta.com.do'

export function digestLinks(productSlug: string | null, unsubscribeToken: string, year: number) {
  const UTM = `utm_source=email&utm_medium=email&utm_campaign=black-friday-${year}`
  return {
    product: productSlug ? `${SITE}/product/${encodeURIComponent(productSlug)}?${UTM}` : `${SITE}/black-friday?${UTM}`,
    page: `${SITE}/black-friday?${UTM}`,
    unsubscribe: `${SITE}/cuenta/black-friday?baja=${unsubscribeToken}`,
  }
}

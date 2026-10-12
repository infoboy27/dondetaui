import { createSign } from 'node:crypto'

// GA4 Data API through a service account, with no Google SDK: sign a JWT,
// trade it for an access token, call runReport. Configured per stack with
// GA_PROPERTY_ID (the numeric property id, not the G-XXXX measurement id) and
// GA_SERVICE_ACCOUNT_JSON (the key file's JSON, raw or base64). Unconfigured,
// every call returns null and the portal simply hides the traffic section.

interface ServiceAccount {
  client_email: string
  private_key: string
}

export interface AnalyticsSummary {
  totals: { users: number; sessions: number; pageViews: number; avgSessionSeconds: number }
  byDay: Array<{ date: string; users: number; sessions: number; pageViews: number }>
  devices: Array<{ label: string; sessions: number }>
  channels: Array<{ label: string; sessions: number }>
  topPages: Array<{ label: string; pageViews: number }>
}

type ReportRow = { dimensionValues?: Array<{ value: string }>; metricValues?: Array<{ value: string }> }

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  const parsed = JSON.parse(json) as ServiceAccount
  return parsed.client_email && parsed.private_key ? parsed : null
}

export function analyticsConfigured(): boolean {
  return Boolean(process.env.GA_PROPERTY_ID && process.env.GA_SERVICE_ACCOUNT_JSON)
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function accessToken(account: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const now = Math.floor(Date.now() / 1000)
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key, 'base64url')
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  })
  if (!response.ok) throw new Error(`Google token request failed (${response.status}): ${await response.text()}`)
  const body = await response.json() as { access_token: string; expires_in: number }
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 }
  return body.access_token
}

async function runReport(token: string, days: number, dimensions: string[], metrics: string[], limit?: number, eventName?: string): Promise<ReportRow[]> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
        ...(limit ? { limit, orderBys: [{ metric: { metricName: metrics[0] }, desc: true }] } : {}),
        ...(eventName ? { dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: eventName } } } } : {}),
      }),
    },
  )
  if (!response.ok) throw new Error(`GA4 runReport failed (${response.status}): ${await response.text()}`)
  const body = await response.json() as { rows?: ReportRow[] }
  return body.rows ?? []
}

const num = (row: ReportRow, index: number) => Number(row.metricValues?.[index]?.value ?? 0)
const dim = (row: ReportRow, index = 0) => row.dimensionValues?.[index]?.value ?? ''

// Sessions that came from Instagram (bio link, stories, l.instagram.com
// redirects, utm_source=instagram), for the Instagram metrics in /admin.
// null when GA4 isn't configured.
export async function instagramSessions(days: number): Promise<number | null> {
  const account = serviceAccount()
  if (!account || !process.env.GA_PROPERTY_ID) return null
  const rows = await runReport(await accessToken(account), days, ['sessionSource'], ['sessions'], 200)
  return rows.filter(row => /instagram|^ig$/i.test(dim(row))).reduce((sum, row) => sum + num(row, 0), 0)
}

const cache = new Map<number, { at: number; value: AnalyticsSummary }>()
const CACHE_MS = 10 * 60_000

export async function analyticsSummary(days: number): Promise<AnalyticsSummary | null> {
  const account = serviceAccount()
  if (!account || !process.env.GA_PROPERTY_ID) return null
  const hit = cache.get(days)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value

  const token = await accessToken(account)
  const [totals, byDay, devices, channels, pages] = await Promise.all([
    runReport(token, days, [], ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration']),
    runReport(token, days, ['date'], ['activeUsers', 'sessions', 'screenPageViews']),
    runReport(token, days, ['deviceCategory'], ['sessions']),
    runReport(token, days, ['sessionDefaultChannelGroup'], ['sessions']),
    runReport(token, days, ['pagePath'], ['screenPageViews'], 10),
  ])

  const value: AnalyticsSummary = {
    totals: {
      users: totals[0] ? num(totals[0], 0) : 0,
      sessions: totals[0] ? num(totals[0], 1) : 0,
      pageViews: totals[0] ? num(totals[0], 2) : 0,
      avgSessionSeconds: totals[0] ? Math.round(num(totals[0], 3)) : 0,
    },
    byDay: byDay
      .map(row => {
        const d = dim(row)
        return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, users: num(row, 0), sessions: num(row, 1), pageViews: num(row, 2) }
      })
      .sort((a, b) => a.date.localeCompare(b.date)),
    devices: devices.map(row => ({ label: dim(row), sessions: num(row, 0) })).sort((a, b) => b.sessions - a.sessions),
    channels: channels.map(row => ({ label: dim(row), sessions: num(row, 0) })).sort((a, b) => b.sessions - a.sessions),
    topPages: pages.map(row => ({ label: dim(row), pageViews: num(row, 0) })),
  }
  cache.set(days, { at: Date.now(), value })
  return value
}

// Traffic per campaign (utm_source / utm_medium / utm_campaign), with the
// store visits each one produced (click_offer). Paid = a medium that says so
// (paid, cpc, ppc, paid_social, ads...); Instagram's own "Promocionar" adds no
// UTM, so a promotion only shows as paid when its link carries utm_medium=paid.
export interface CampaignRow {
  source: string
  medium: string
  campaign: string
  paid: boolean
  sessions: number
  users: number
  engagedSessions: number
  offerClicks: number
}

const CAMPAIGN_DIMENSIONS = ['sessionSource', 'sessionMedium', 'sessionCampaignName']

export function isPaidMedium(medium: string): boolean {
  return /paid|cpc|ppc|cpm|(^|[^a-z])ads?($|[^a-z])/i.test(medium)
}

export function campaignRows(traffic: ReportRow[], clicks: ReportRow[]): CampaignRow[] {
  const key = (row: ReportRow) => [dim(row, 0), dim(row, 1), dim(row, 2)].join('|')
  const clicksByKey = new Map(clicks.map(row => [key(row), num(row, 0)]))
  return traffic
    .map(row => {
      const medium = dim(row, 1)
      return {
        source: dim(row, 0),
        medium,
        campaign: dim(row, 2),
        paid: isPaidMedium(medium),
        sessions: num(row, 0),
        users: num(row, 1),
        engagedSessions: num(row, 2),
        offerClicks: clicksByKey.get(key(row)) ?? 0,
      }
    })
    .sort((a, b) => Number(b.paid) - Number(a.paid) || b.sessions - a.sessions)
}

const campaignCache = new Map<number, { at: number; value: CampaignRow[] }>()

export async function campaignReport(days: number): Promise<CampaignRow[] | null> {
  const account = serviceAccount()
  if (!account || !process.env.GA_PROPERTY_ID) return null
  const hit = campaignCache.get(days)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value
  const token = await accessToken(account)
  const [traffic, clicks] = await Promise.all([
    runReport(token, days, CAMPAIGN_DIMENSIONS, ['sessions', 'activeUsers', 'engagedSessions'], 50),
    runReport(token, days, CAMPAIGN_DIMENSIONS, ['eventCount'], 200, 'click_offer'),
  ])
  const value = campaignRows(traffic, clicks)
  campaignCache.set(days, { at: Date.now(), value })
  return value
}

import { createSign } from 'node:crypto'
import { gunzipSync } from 'node:zlib'

// Store and ad-earnings numbers for the /admin dashboard, read straight from
// the stores and ad networks (no Google/Apple SDKs):
//   - Google Play installs: the monthly CSVs Play exports to its Cloud Storage
//     bucket (PLAY_REPORTS_BUCKET), read with a service account
//     (PLAY_SERVICE_ACCOUNT_JSON) that has "view app info and download bulk
//     reports" at account level.
//   - App Store downloads: daily Sales reports through the App Store Connect
//     API key (ASC_KEY_ID / ASC_ISSUER_ID / ASC_PRIVATE_KEY + ASC_VENDOR_NUMBER).
//   - AdMob (app) and AdSense (web) earnings: both APIs refuse service
//     accounts, so they use an OAuth refresh token granted once by the account
//     owner (GOOGLE_OAUTH_CLIENT_ID / _SECRET + GOOGLE_ADS_REFRESH_TOKEN; see
//     apps/api/scripts/google-ads-oauth.mjs).
// Each source is optional: unconfigured, it reports configured:false and the
// dashboard shows how to connect it. Parsers are pure and tested.

export interface DailyPoint { date: string; value: number }

export interface PlayStats {
  installs: number
  uninstalls: number
  activeDevices: number | null
  byDay: Array<{ date: string; installs: number; uninstalls: number }>
  byCountry: Array<{ label: string; installs: number }>
}

export interface AppStoreStats {
  downloads: number
  updates: number
  byDay: DailyPoint[]
  byCountry: Array<{ label: string; downloads: number }>
}

export interface EarningsSource { earnings: number; impressions: number; clicks: number; byDay: DailyPoint[] }

export interface EarningsStats {
  currency: 'USD'
  admob: EarningsSource | null
  adsense: EarningsSource | null
  /** Unpaid balance shared by AdMob and AdSense (same payments account). */
  balance: number | null
  payoutThreshold: number
}

// --- Pure helpers -----------------------------------------------------------

/** YYYY-MM-DD for each of the last `days` days, oldest first, ending `end` (UTC). */
export function lastDays(days: number, end = new Date()): string[] {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i))
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

/** Play exports are UTF-16LE with a BOM (older ones UTF-8). */
export function decodeReport(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le')
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) return buffer.subarray(3).toString('utf8')
  return buffer.toString('utf8')
}

function csvRows(text: string): string[][] {
  return text.split(/\r?\n/).filter(line => line.trim()).map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
}

function column(header: string[], ...names: string[]): number {
  const lower = header.map(h => h.toLowerCase())
  for (const name of names) {
    const index = lower.indexOf(name.toLowerCase())
    if (index >= 0) return index
  }
  return -1
}

const num = (value: string | undefined) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** installs_<pkg>_<YYYYMM>_overview.csv -> per-day user installs/uninstalls and active devices. */
export function parsePlayOverview(text: string) {
  const [header, ...rows] = csvRows(text)
  if (!header) return []
  const date = column(header, 'Date')
  const installs = column(header, 'Daily User Installs', 'Daily Device Installs')
  const uninstalls = column(header, 'Daily User Uninstalls', 'Daily Device Uninstalls')
  const active = column(header, 'Active Device Installs', 'Total User Installs')
  return rows.filter(r => r[date]).map(r => ({
    date: r[date],
    installs: num(r[installs]),
    uninstalls: num(r[uninstalls]),
    active: active >= 0 ? num(r[active]) : null,
  }))
}

/** installs_<pkg>_<YYYYMM>_country.csv -> per-day installs per country. */
export function parsePlayCountry(text: string) {
  const [header, ...rows] = csvRows(text)
  if (!header) return []
  const date = column(header, 'Date')
  const country = column(header, 'Country')
  const installs = column(header, 'Daily User Installs', 'Daily Device Installs')
  return rows.filter(r => r[date] && r[country]).map(r => ({ date: r[date], country: r[country], installs: num(r[installs]) }))
}

export function summarizePlay(
  overview: ReturnType<typeof parsePlayOverview>,
  countries: ReturnType<typeof parsePlayCountry>,
  window: string[],
): PlayStats {
  const inWindow = new Set(window)
  const byDate = new Map(overview.map(r => [r.date, r]))
  const byDay = window.map(date => ({ date, installs: byDate.get(date)?.installs ?? 0, uninstalls: byDate.get(date)?.uninstalls ?? 0 }))
  const latest = [...overview].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const totals = new Map<string, number>()
  for (const r of countries) if (inWindow.has(r.date)) totals.set(r.country, (totals.get(r.country) ?? 0) + r.installs)
  return {
    installs: byDay.reduce((sum, d) => sum + d.installs, 0),
    uninstalls: byDay.reduce((sum, d) => sum + d.uninstalls, 0),
    activeDevices: latest?.active ?? null,
    byDay,
    byCountry: [...totals].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, installs]) => ({ label, installs })),
  }
}

// Apple Sales report product types: first downloads vs updates (iPhone/iPad/universal).
const APPLE_DOWNLOAD_TYPES = new Set(['1', '1F', '1T', 'F1'])
const APPLE_UPDATE_TYPES = new Set(['7', '7F', '7T', 'F7'])

/** One daily Sales SUMMARY report (TSV) -> units for this app. */
export function parseAppleSales(text: string, appleId: string) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(line => line.trim())
  if (!headerLine) return { downloads: 0, updates: 0, byCountry: new Map<string, number>() }
  const header = headerLine.split('\t')
  const type = column(header, 'Product Type Identifier')
  const units = column(header, 'Units')
  const id = column(header, 'Apple Identifier')
  const country = column(header, 'Country Code')
  let downloads = 0
  let updates = 0
  const byCountry = new Map<string, number>()
  for (const line of lines) {
    const cells = line.split('\t')
    if (id >= 0 && cells[id] !== appleId) continue
    const n = num(cells[units])
    if (APPLE_DOWNLOAD_TYPES.has(cells[type])) {
      downloads += n
      byCountry.set(cells[country], (byCountry.get(cells[country]) ?? 0) + n)
    } else if (APPLE_UPDATE_TYPES.has(cells[type])) updates += n
  }
  return { downloads, updates, byCountry }
}

type AdmobChunk = {
  row?: {
    dimensionValues?: Record<string, { value?: string }>
    metricValues?: Record<string, { microsValue?: string; integerValue?: string; doubleValue?: number }>
  }
}

/** networkReport:generate stream -> per-day earnings/impressions/clicks. */
export function parseAdmobReport(chunks: AdmobChunk[], window: string[]): EarningsSource {
  const days = new Map<string, { earnings: number; impressions: number; clicks: number }>()
  for (const chunk of chunks) {
    const row = chunk.row
    const raw = row?.dimensionValues?.DATE?.value
    if (!row || !raw) continue
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
    const day = days.get(date) ?? { earnings: 0, impressions: 0, clicks: 0 }
    day.earnings += num(row.metricValues?.ESTIMATED_EARNINGS?.microsValue) / 1e6
    day.impressions += num(row.metricValues?.IMPRESSIONS?.integerValue)
    day.clicks += num(row.metricValues?.CLICKS?.integerValue)
    days.set(date, day)
  }
  return earningsSource(days, window)
}

type AdsenseReport = { headers?: Array<{ name: string }>; rows?: Array<{ cells: Array<{ value?: string }> }> }

/** AdSense reports:generate (DATE x earnings/impressions/clicks) -> per-day. */
export function parseAdsenseReport(report: AdsenseReport, window: string[]): EarningsSource {
  const names = (report.headers ?? []).map(h => h.name)
  const at = (name: string) => names.indexOf(name)
  const days = new Map<string, { earnings: number; impressions: number; clicks: number }>()
  for (const row of report.rows ?? []) {
    const date = row.cells[at('DATE')]?.value
    if (!date) continue
    days.set(date, {
      earnings: num(row.cells[at('ESTIMATED_EARNINGS')]?.value),
      impressions: num(row.cells[at('IMPRESSIONS')]?.value),
      clicks: num(row.cells[at('CLICKS')]?.value),
    })
  }
  return earningsSource(days, window)
}

function earningsSource(days: Map<string, { earnings: number; impressions: number; clicks: number }>, window: string[]): EarningsSource {
  const inWindow = window.map(date => ({ date, ...(days.get(date) ?? { earnings: 0, impressions: 0, clicks: 0 }) }))
  return {
    earnings: round2(inWindow.reduce((sum, d) => sum + d.earnings, 0)),
    impressions: inWindow.reduce((sum, d) => sum + d.impressions, 0),
    clicks: inWindow.reduce((sum, d) => sum + d.clicks, 0),
    byDay: inWindow.map(d => ({ date: d.date, value: round2(d.earnings) })),
  }
}

/** AdSense payments list -> unpaid balance ("USD 0.34" or a bare number). */
export function parseUnpaidBalance(payments: { payments?: Array<{ name?: string; amount?: string }> }): number | null {
  const unpaid = payments.payments?.find(p => p.name?.endsWith('/unpaid'))
  if (!unpaid?.amount) return null
  const match = unpaid.amount.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return match ? round2(Number(match[0])) : null
}

const round2 = (n: number) => Math.round(n * 100) / 100

// --- Configuration ----------------------------------------------------------

interface ServiceAccount { client_email: string; private_key: string }

function parseJsonSecret<T>(raw: string | undefined): T | null {
  const value = raw?.trim()
  if (!value) return null
  return JSON.parse(value.startsWith('{') ? value : Buffer.from(value, 'base64').toString('utf8')) as T
}

export const playConfigured = () => Boolean(process.env.PLAY_SERVICE_ACCOUNT_JSON && process.env.PLAY_REPORTS_BUCKET && process.env.PLAY_PACKAGE_NAME)
export const appStoreConfigured = () => Boolean(process.env.ASC_KEY_ID && process.env.ASC_ISSUER_ID && process.env.ASC_PRIVATE_KEY && process.env.ASC_VENDOR_NUMBER && process.env.ASC_APP_ID)
export const earningsConfigured = () => Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_ADS_REFRESH_TOKEN && process.env.ADS_PUBLISHER_ID)

// --- Tokens -----------------------------------------------------------------

const tokens = new Map<string, { value: string; expiresAt: number }>()

async function exchange(key: string, body: URLSearchParams): Promise<string> {
  const cached = tokens.get(key)
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error(`Google token request failed (${response.status}): ${(await response.text()).slice(0, 200)}`)
  const json = await response.json() as { access_token: string; expires_in: number }
  tokens.set(key, { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 })
  return json.access_token
}

function serviceAccountToken(account: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: account.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key, 'base64url')
  return exchange(`sa:${scope}`, new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }))
}

function ownerToken(): Promise<string> {
  return exchange('owner', new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  }))
}

function appStoreToken(): string {
  const now = Math.floor(Date.now() / 1000)
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsigned = `${encode({ alg: 'ES256', kid: process.env.ASC_KEY_ID, typ: 'JWT' })}.${encode({ iss: process.env.ASC_ISSUER_ID, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' })}`
  const key = process.env.ASC_PRIVATE_KEY!.includes('BEGIN') ? process.env.ASC_PRIVATE_KEY! : Buffer.from(process.env.ASC_PRIVATE_KEY!, 'base64').toString('utf8')
  const signature = createSign('SHA256').update(unsigned).sign({ key: key.replace(/\\n/g, '\n'), dsaEncoding: 'ieee-p1363' }, 'base64url')
  return `${unsigned}.${signature}`
}

// --- Fetchers (cached) ------------------------------------------------------

const CACHE_MS = 30 * 60_000
const caches = new Map<string, { at: number; value: Promise<unknown> }>()

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = caches.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>
  const value = load()
  caches.set(key, { at: Date.now(), value })
  value.catch(() => caches.delete(key))
  return value
}

async function playObject(token: string, name: string): Promise<Buffer | null> {
  const bucket = process.env.PLAY_REPORTS_BUCKET!.replace(/^gs:\/\//, '').replace(/\/.*$/, '')
  const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(name)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Play reports ${response.status}: ${(await response.text()).slice(0, 200)}`)
  return Buffer.from(await response.arrayBuffer())
}

export function playStats(days: number): Promise<PlayStats> {
  return cached(`play:${days}`, async () => {
    const account = parseJsonSecret<ServiceAccount>(process.env.PLAY_SERVICE_ACCOUNT_JSON)!
    const token = await serviceAccountToken(account, 'https://www.googleapis.com/auth/devstorage.read_only')
    const window = lastDays(days)
    const months = [...new Set(window.map(d => d.slice(0, 7).replace('-', '')))]
    const pkg = process.env.PLAY_PACKAGE_NAME!
    const overview: ReturnType<typeof parsePlayOverview> = []
    const countries: ReturnType<typeof parsePlayCountry> = []
    for (const month of months) {
      const [o, c] = await Promise.all([
        playObject(token, `stats/installs/installs_${pkg}_${month}_overview.csv`),
        playObject(token, `stats/installs/installs_${pkg}_${month}_country.csv`),
      ])
      if (o) overview.push(...parsePlayOverview(decodeReport(o)))
      if (c) countries.push(...parsePlayCountry(decodeReport(c)))
    }
    return summarizePlay(overview, countries, window)
  })
}

export function appStoreStats(days: number): Promise<AppStoreStats> {
  return cached(`asc:${days}`, async () => {
    // Daily reports exist from the day after; today's never does.
    const window = lastDays(days, new Date(Date.now() - 86_400_000))
    const appleId = process.env.ASC_APP_ID!
    const results: Array<{ date: string; downloads: number; updates: number; byCountry: Map<string, number> }> = []
    const queue = [...window]
    async function worker() {
      for (let date = queue.shift(); date; date = queue.shift()) {
        const params = new URLSearchParams({
          'filter[frequency]': 'DAILY', 'filter[reportType]': 'SALES', 'filter[reportSubType]': 'SUMMARY',
          'filter[vendorNumber]': process.env.ASC_VENDOR_NUMBER!, 'filter[reportDate]': date, 'filter[version]': '1_1',
        })
        const response = await fetch(`https://api.appstoreconnect.apple.com/v1/salesReports?${params}`, { headers: { Authorization: `Bearer ${appStoreToken()}`, Accept: 'application/a-gzip' } })
        // 404 = no sales (no downloads) that day, or the report isn't out yet.
        if (response.status === 404) { results.push({ date, downloads: 0, updates: 0, byCountry: new Map() }); continue }
        if (!response.ok) throw new Error(`App Store sales report ${response.status}: ${(await response.text()).slice(0, 200)}`)
        const text = gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8')
        results.push({ date, ...parseAppleSales(text, appleId) })
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker))
    const byDate = new Map(results.map(r => [r.date, r]))
    const countries = new Map<string, number>()
    for (const r of results) for (const [c, n] of r.byCountry) countries.set(c, (countries.get(c) ?? 0) + n)
    return {
      downloads: results.reduce((s, r) => s + r.downloads, 0),
      updates: results.reduce((s, r) => s + r.updates, 0),
      byDay: window.map(date => ({ date, value: byDate.get(date)?.downloads ?? 0 })),
      byCountry: [...countries].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, downloads]) => ({ label, downloads })),
    }
  })
}

const ymd = (date: string) => { const [year, month, day] = date.split('-').map(Number); return { year, month, day } }

export function earningsStats(days: number): Promise<EarningsStats> {
  return cached(`earnings:${days}`, async () => {
    const token = await ownerToken()
    const publisher = process.env.ADS_PUBLISHER_ID!.replace(/^ca-app-/, '')
    const window = lastDays(days)
    const start = ymd(window[0])
    const end = ymd(window[window.length - 1])
    const auth = { Authorization: `Bearer ${token}` }

    const admob = (async () => {
      const response = await fetch(`https://admob.googleapis.com/v1/accounts/${publisher}/networkReport:generate`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportSpec: {
          dateRange: { startDate: start, endDate: end },
          dimensions: ['DATE'],
          metrics: ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'CLICKS'],
          localizationSettings: { currencyCode: 'USD' },
        } }),
      })
      if (!response.ok) throw new Error(`AdMob ${response.status}: ${(await response.text()).slice(0, 200)}`)
      return parseAdmobReport(await response.json() as AdmobChunk[], window)
    })()

    const adsense = (async () => {
      const params = new URLSearchParams({
        dateRange: 'CUSTOM', currencyCode: 'USD',
        'startDate.year': String(start.year), 'startDate.month': String(start.month), 'startDate.day': String(start.day),
        'endDate.year': String(end.year), 'endDate.month': String(end.month), 'endDate.day': String(end.day),
      })
      params.append('dimensions', 'DATE')
      for (const metric of ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'CLICKS']) params.append('metrics', metric)
      const response = await fetch(`https://adsense.googleapis.com/v2/accounts/${publisher}/reports:generate?${params}`, { headers: auth })
      if (!response.ok) throw new Error(`AdSense ${response.status}: ${(await response.text()).slice(0, 200)}`)
      return parseAdsenseReport(await response.json() as AdsenseReport, window)
    })()

    const balance = (async () => {
      const response = await fetch(`https://adsense.googleapis.com/v2/accounts/${publisher}/payments`, { headers: auth })
      return response.ok ? parseUnpaidBalance(await response.json() as { payments?: Array<{ name?: string; amount?: string }> }) : null
    })()

    // One source failing (API not enabled, no AdSense site) keeps the others.
    const [a, s, b] = await Promise.allSettled([admob, adsense, balance])
    if (a.status === 'rejected' && s.status === 'rejected') throw a.reason
    return {
      currency: 'USD',
      admob: a.status === 'fulfilled' ? a.value : null,
      adsense: s.status === 'fulfilled' ? s.value : null,
      balance: b.status === 'fulfilled' ? b.value : null,
      payoutThreshold: 100,
    }
  })
}

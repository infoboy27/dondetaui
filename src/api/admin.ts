import type { CardPromotion } from '../domain/cardPromotions'
import { apiFetch } from './http'

export interface ClickSeries {
  total: number
  byDay: Array<{ date: string; clicks: number }>
  bySource: Array<{ label: string; clicks: number }>
  topProducts: Array<{ name: string; slug: string; store: string; clicks: number }>
}

export interface RetailerStats {
  slug: string
  name: string
  abbr: string
  color: string
  websiteUrl: string | null
  products: number
  compared: number
  wins: number
  clicks: number
}

export interface CatalogStats {
  products: number
  offers: number
  compared: number
  retailers: number
  lastSeenAt: string | null
}

export interface AnalyticsSummary {
  totals: { users: number; sessions: number; pageViews: number; avgSessionSeconds: number }
  byDay: Array<{ date: string; users: number; sessions: number; pageViews: number }>
  devices: Array<{ label: string; sessions: number }>
  channels: Array<{ label: string; sessions: number }>
  topPages: Array<{ label: string; pageViews: number }>
}

export interface AnalyticsResult {
  configured: boolean
  data: AnalyticsSummary | null
  error: string | null
}

export interface IngestionStatus {
  retailer: string
  lastStatus: string | null
  lastFinishedAt: string | null
  lastIngested: number
  lastError: string | null
  freshOffers: number
  problems: string[]
}

export interface AdminOverview {
  days: number
  generatedAt: string
  catalog: CatalogStats
  clicks: ClickSeries
  retailers: RetailerStats[]
  ingestion: IngestionStatus[]
  analytics: AnalyticsResult
}

export interface PriceComparison {
  name: string
  slug: string
  image: string | null
  myPrice: number
  otherStore: string
  otherPrice: number
}

export interface RetailerReport {
  days: number
  generatedAt: string
  catalog: CatalogStats
  analytics: AnalyticsResult
  retailer: RetailerStats
  clicks: ClickSeries
  categories: Array<{ label: string; products: number }>
  wins: PriceComparison[]
  losses: PriceComparison[]
  avgWinMargin: number
  avgLossGap: number
}

export interface InstagramStatus {
  configured: boolean
  username?: string
  tokenUpdatedAt?: string | null
  error?: string
}

export interface InstagramPost {
  id: string
  product_id: string | null
  kind: string
  target: 'feed' | 'story'
  format?: 'image' | 'carousel' | 'reel'
  source?: 'manual' | 'autopilot'
  caption: string
  status: 'pending' | 'published' | 'failed'
  permalink: string | null
  error: string | null
  created_at: string
  published_at: string | null
}

// GET /admin/instagram/insights -- apps/api/src/admin/instagram-insights.ts.
export interface InstagramInsightsPeriod {
  reach: number
  views: number
  engaged: number
  interactions: number
  linkTaps: number
  follows: number | null
  unfollows: number | null
}

export interface InstagramInsights {
  generatedAt: string
  account: { username: string; followers: number; follows: number; mediaCount: number }
  week: InstagramInsightsPeriod
  month: InstagramInsightsPeriod
  reachByDay: Array<{ date: string; value: number }>
  newFollowersByDay: Array<{ date: string; value: number }>
  followersHistory: Array<{ date: string; value: number }>
  cities: Array<{ label: string; value: number }>
  ages: Array<{ label: string; value: number }>
  genders: Array<{ label: string; value: number }>
  posts: Array<{
    id: string
    permalink: string | null
    timestamp: string
    format: 'image' | 'carousel' | 'reel'
    title: string
    source: 'manual' | 'autopilot' | null
    reach: number
    views: number
    likes: number
    comments: number
    saved: number
    shares: number
    interactions: number
  }>
  byFormat: Array<{ format: 'image' | 'carousel' | 'reel'; posts: number; avgReach: number; avgViews: number; avgInteractions: number }>
  siteVisits: number | null
}

// GET /admin/campaigns -- apps/api/src/admin/google-analytics.ts campaignRows.
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

export interface CampaignReport {
  days: number
  configured: boolean
  rows: CampaignRow[] | null
  error: string | null
}

export interface InstagramAutopilot {
  enabled: boolean
  slots: { target: 'feed' | 'story'; hour: number }[]
}

export interface FacebookCrossPost {
  configured: boolean
  enabled: boolean
  page?: string
  error?: string
  history?: { id: string; format: string; status: 'published' | 'failed'; permalink: string | null; error: string | null; created_at: string }[]
}

export interface CardPromotionForm {
  retailerSlug: string
  bank: string
  card: string
  percent: string
  maxDiscount: string
  minPurchase: string
  weekdays: number[]
  startsOn: string
  endsOn: string
  termsUrl: string
  note: string
}

export const adminApi = {
  cardPromotions(): Promise<CardPromotion[]> {
    return apiFetch('/admin/card-promotions')
  },
  createCardPromotion(form: CardPromotionForm): Promise<CardPromotion> {
    return apiFetch('/admin/card-promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
  },
  deleteCardPromotion(id: string): Promise<{ ok: true }> {
    return apiFetch(`/admin/card-promotions/${id}`, { method: 'DELETE' })
  },
  igFacebook(): Promise<FacebookCrossPost> {
    return apiFetch('/admin/instagram/facebook')
  },
  igSetFacebook(enabled: boolean): Promise<FacebookCrossPost> {
    return apiFetch('/admin/instagram/facebook', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) })
  },
  igAutopilot(): Promise<InstagramAutopilot> {
    return apiFetch('/admin/instagram/autopilot')
  },
  igSetAutopilot(enabled: boolean): Promise<InstagramAutopilot> {
    return apiFetch('/admin/instagram/autopilot', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) })
  },
  campaigns(days: number): Promise<CampaignReport> {
    return apiFetch(`/admin/campaigns?days=${days}`)
  },
  igInsights(): Promise<InstagramInsights> {
    return apiFetch('/admin/instagram/insights')
  },
  igStatus(): Promise<InstagramStatus> {
    return apiFetch('/admin/instagram/status')
  },
  igHistory(): Promise<InstagramPost[]> {
    return apiFetch('/admin/instagram/posts')
  },
  igPublish(input: { productId: string; kind: 'comparison' | 'drop'; target: 'feed' | 'story'; caption: string; imageBase64: string; force?: boolean }): Promise<{ id: string; status: string; permalink: string | null }> {
    return apiFetch('/admin/instagram/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  },
  // Own images (campaigns): published in the background; follow it in igHistory().
  igPublishCustom(input: { target: 'feed' | 'story'; caption: string; imagesBase64: string[] }): Promise<{ status: string }> {
    return apiFetch('/admin/instagram/custom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  },
  me(): Promise<{ admin: boolean }> {
    return apiFetch('/admin/me')
  },
  mfaSetup(): Promise<{ secret: string; otpauthUrl: string }> {
    return apiFetch('/admin/mfa/setup', { method: 'POST' })
  },
  mfaEnable(code: string): Promise<{ token: string }> {
    return apiFetch('/admin/mfa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
  },
  mfaVerify(code: string): Promise<{ token: string }> {
    return apiFetch('/admin/mfa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
  },
  logoutAll(): Promise<{ token: string }> {
    return apiFetch('/admin/mfa/logout-all', { method: 'POST' })
  },
  overview(days: number): Promise<AdminOverview> {
    return apiFetch(`/admin/overview?days=${days}`)
  },
  report(slug: string, days: number): Promise<RetailerReport> {
    return apiFetch(`/admin/retailers/${encodeURIComponent(slug)}/report?days=${days}`)
  },
}

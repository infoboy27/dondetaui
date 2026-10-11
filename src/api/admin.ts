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

export const adminApi = {
  me(): Promise<{ admin: boolean }> {
    return apiFetch('/admin/me')
  },
  overview(days: number): Promise<AdminOverview> {
    return apiFetch(`/admin/overview?days=${days}`)
  },
  report(slug: string, days: number): Promise<RetailerReport> {
    return apiFetch(`/admin/retailers/${encodeURIComponent(slug)}/report?days=${days}`)
  },
}

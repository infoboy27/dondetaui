// Shapes the Instagram insights API answers into what /admin shows. Pure;
// the HTTP calls live in InstagramService.insights().

export type PostFormat = 'image' | 'carousel' | 'reel'

export interface MediaRow {
  id: string
  media_type?: string
  media_product_type?: string
  timestamp: string
  permalink?: string
  caption?: string
  like_count?: number
  comments_count?: number
}

export interface PostStats {
  id: string
  permalink: string | null
  timestamp: string
  format: PostFormat
  title: string
  source: 'manual' | 'autopilot' | null
  reach: number
  views: number
  likes: number
  comments: number
  saved: number
  shares: number
  interactions: number
}

export interface FormatStats {
  format: PostFormat
  posts: number
  avgReach: number
  avgViews: number
  avgInteractions: number
}

export interface InsightsPeriod {
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
  week: InsightsPeriod
  month: InsightsPeriod
  reachByDay: Array<{ date: string; value: number }>
  newFollowersByDay: Array<{ date: string; value: number }>
  followersHistory: Array<{ date: string; value: number }>
  cities: Array<{ label: string; value: number }>
  ages: Array<{ label: string; value: number }>
  genders: Array<{ label: string; value: number }>
  posts: PostStats[]
  byFormat: FormatStats[]
  /** GA4 sessions whose source is Instagram, last 28 days (null: GA4 not set up). */
  siteVisits: number | null
}

export function mediaFormat(media: Pick<MediaRow, 'media_type' | 'media_product_type'>): PostFormat {
  if (media.media_product_type === 'REELS') return 'reel'
  if (media.media_type === 'CAROUSEL_ALBUM') return 'carousel'
  return 'image'
}

type TotalValueMetric = { name: string; total_value?: { value?: number; breakdowns?: Array<{ results?: Array<{ dimension_values: string[]; value: number }> }> } }
type SeriesMetric = { name: string; values?: Array<{ value: number; end_time?: string }> }

export function totals(metrics: TotalValueMetric[], follows?: TotalValueMetric[]): InsightsPeriod {
  const value = (name: string) => metrics.find(m => m.name === name)?.total_value?.value ?? 0
  // follows_and_unfollows broken down by follow_type: FOLLOWER = accounts
  // that followed, NON_FOLLOWER = accounts that unfollowed.
  const results = follows?.[0]?.total_value?.breakdowns?.[0]?.results
  const byType = (type: string) => results ? results.find(r => r.dimension_values[0] === type)?.value ?? 0 : null
  return {
    reach: value('reach'),
    views: value('views'),
    engaged: value('accounts_engaged'),
    interactions: value('total_interactions'),
    linkTaps: value('profile_links_taps'),
    follows: byType('FOLLOWER'),
    unfollows: byType('NON_FOLLOWER'),
  }
}

// Daily series: end_time is the end of the day in Pacific time (07:00 UTC),
// so the day being measured is the one before it.
export function series(metrics: SeriesMetric[] | undefined): Array<{ date: string; value: number }> {
  return (metrics?.[0]?.values ?? []).map(point => {
    const end = new Date(point.end_time ?? Date.now())
    end.setUTCDate(end.getUTCDate() - 1)
    return { date: end.toISOString().slice(0, 10), value: point.value }
  })
}

export function breakdown(metrics: TotalValueMetric[] | undefined, limit = 8, label: (key: string) => string = key => key): Array<{ label: string; value: number }> {
  return (metrics?.[0]?.total_value?.breakdowns?.[0]?.results ?? [])
    .map(r => ({ label: label(r.dimension_values[0]), value: r.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function byFormat(posts: PostStats[]): FormatStats[] {
  const order: PostFormat[] = ['reel', 'carousel', 'image']
  return order
    .map(format => {
      const group = posts.filter(p => p.format === format)
      const avg = (pick: (p: PostStats) => number) => (group.length ? Math.round(group.reduce((sum, p) => sum + pick(p), 0) / group.length) : 0)
      return { format, posts: group.length, avgReach: avg(p => p.reach), avgViews: avg(p => p.views), avgInteractions: avg(p => p.interactions) }
    })
    .filter(f => f.posts > 0)
}

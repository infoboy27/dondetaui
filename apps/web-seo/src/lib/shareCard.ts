// Data for the product share card (app/product/[slug]/share-image): the
// 1200x630 image WhatsApp, Facebook and X show under a shared link. Pure
// functions; the layout lives in the route.
import type { PriceCheck, PricePoint } from './types'

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

/** Daily points of the last `days` days, counted back from `now`, oldest first. */
export function recentHistory(history: PricePoint[] | undefined, now: Date, days = 30): PricePoint[] {
  const from = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10)
  const byDay = new Map<string, number>()
  for (const p of history ?? []) {
    if (typeof p?.date !== 'string' || !(p.price > 0) || !Number.isFinite(p.price)) continue
    const day = p.date.slice(0, 10)
    if (day >= from) byDay.set(day, p.price)
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, price]) => ({ date, price }))
}

/**
 * SVG path of a sparkline fitted to width x height (with `pad` px inside),
 * x by date so gaps in the data show as gaps in time. null under 2 points.
 * A flat series is drawn through the middle.
 */
export function sparklinePath(points: PricePoint[], width: number, height: number, pad = 4): string | null {
  if (points.length < 2) return null
  const times = points.map(p => Date.parse(p.date))
  const t0 = times[0]
  const span = times[times.length - 1] - t0 || 1
  const prices = points.map(p => p.price)
  const min = Math.min(...prices)
  const range = Math.max(...prices) - min
  const w = width - pad * 2
  const h = height - pad * 2
  return points
    .map((p, i) => {
      const x = pad + ((times[i] - t0) / span) * w
      const y = range === 0 ? height / 2 : pad + (1 - (p.price - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export interface CardVerdict {
  label: string
  detail: string
  tone: 'good' | 'warn' | 'bad'
}

/**
 * The /black-friday verdict for the store whose price the card shows (the
 * API judges each store's offer on its own history). None when that store
 * has no verdict: a verdict about another store's price would mislead.
 */
export function cardVerdict(checks: PriceCheck[], store: string | undefined): CardVerdict | null {
  const check = store ? checks.find(c => c.store === store) : undefined
  if (!check) return null
  // Whole percents read better on a card than the API's one decimal.
  switch (check.verdict) {
    case 'lowest':
      return { label: 'Oferta real', detail: `${Math.round(Math.abs(check.pctVsReference))}% bajo su mínimo de 30 días`, tone: 'good' }
    case 'inflated':
      return { label: 'Rebaja inflada', detail: `“Bajó” ${Math.round(check.pctBelowPeak)}%, pero ya costaba eso hace unas semanas`, tone: 'warn' }
    case 'raised':
      return { label: 'Subió de precio', detail: `+${Math.round(check.pctVsReference)}% sobre su mínimo de 30 días`, tone: 'bad' }
  }
}

/** Font size that keeps a long product name inside three lines of the card. */
export function titleSize(name: string): number {
  if (name.length <= 40) return 46
  if (name.length <= 70) return 40
  return 34
}

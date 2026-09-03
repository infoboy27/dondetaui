// Price-history analysis for the server-rendered product pages. Pure
// functions, no JSX -- the SVG chart lives in components/PriceHistoryCard.tsx.
//
// The API returns `priceHistory` as one observation per ingestion cycle.
// Most DR products have only a single retailer, so this history (not a
// cross-store comparison) is the real per-product content a crawler sees.
import type { PricePoint } from './types'

export interface HistoryStats {
  /** Sorted ascending by date, deduped by date, invalid points dropped. */
  points: PricePoint[]
  /** Number of distinct observations. */
  count: number
  /** Calendar days between the first and last observation. */
  spanDays: number
  firstDate: string
  lastDate: string
  min: number
  minDate: string
  max: number
  maxDate: string
  /** Most recent known price (the live offer price when we have one). */
  current: number
  /** current is at or below the lowest ever recorded. */
  isAtLowest: boolean
  /** How far above its recorded minimum the current price sits, in %. >= 0. */
  pctAboveMin: number
  /** How far below its recorded maximum the current price sits, in %. >= 0. */
  pctBelowMax: number
  /** current minus the first observed price. */
  change: number
  changePct: number
  /** Number of times the observed price changed value across the series. */
  changeCount: number
  lastChange?: { date: string; from: number; to: number }
  direction: 'subio' | 'bajo' | 'estable'
}

function isValidPoint(p: PricePoint): boolean {
  return (
    typeof p?.price === 'number' &&
    Number.isFinite(p.price) &&
    p.price > 0 &&
    typeof p?.date === 'string' &&
    !Number.isNaN(Date.parse(p.date))
  )
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a)
  return Math.max(0, Math.round(ms / 86_400_000))
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 1000) / 10
}

/**
 * Returns null when there isn't enough history to say anything useful
 * (fewer than 2 valid observations). Callers should treat a null result as
 * "no history section" and, combined with a single retailer, as a signal
 * that the page is thin (see isThinProduct).
 */
export function analyzeHistory(
  raw: PricePoint[] | undefined,
  fallbackCurrent?: number,
): HistoryStats | null {
  const valid = (raw ?? []).filter(isValidPoint)
  if (valid.length < 2) return null

  // Dedupe by date, keeping the last value seen for a given day, then sort.
  const byDate = new Map<string, number>()
  for (const p of valid) byDate.set(p.date.slice(0, 10), p.price)
  const points = [...byDate.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (points.length < 2) return null

  const first = points[0]!
  const last = points[points.length - 1]!
  const current =
    typeof fallbackCurrent === 'number' && Number.isFinite(fallbackCurrent) && fallbackCurrent > 0
      ? fallbackCurrent
      : last.price

  // min / max consider the current price too, so "at its lowest" stays true
  // even when the live offer dipped below the last recorded observation.
  const series = [...points.map(p => p.price), current]
  const min = Math.min(...series)
  const max = Math.max(...series)
  const minPoint = points.find(p => p.price === min)
  const maxPoint = points.find(p => p.price === max)

  let changeCount = 0
  let lastChange: HistoryStats['lastChange']
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    if (curr.price !== prev.price) {
      changeCount++
      lastChange = { date: curr.date, from: prev.price, to: curr.price }
    }
  }
  if (current !== last.price) {
    changeCount++
    lastChange = { date: last.date, from: last.price, to: current }
  }

  const change = current - first.price
  const direction: HistoryStats['direction'] =
    change > 0 ? 'subio' : change < 0 ? 'bajo' : 'estable'

  return {
    points,
    count: points.length,
    spanDays: daysBetween(first.date, last.date),
    firstDate: first.date,
    lastDate: last.date,
    min,
    minDate: minPoint?.date ?? first.date,
    max,
    maxDate: maxPoint?.date ?? first.date,
    current,
    isAtLowest: current <= min,
    pctAboveMin: Math.max(0, pct(current - min, min)),
    pctBelowMax: Math.max(0, pct(max - current, max)),
    change,
    changePct: pct(change, first.price),
    changeCount,
    lastChange,
    direction,
  }
}

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** "20 de agosto de 2026" — stable, locale-independent, server-safe. */
export function formatDateEs(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getUTCDate()} de ${MONTHS_ES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

/**
 * A few sentences of prose describing this specific product's price history.
 * Every product with history gets a different paragraph -- this is the unique,
 * non-boilerplate content the page needs.
 */
export function describeHistory(
  stats: HistoryStats,
  name: string,
  store: string,
  formatPrice: (n: number) => string,
): string[] {
  const out: string[] = []

  out.push(
    `DóndeTa ha registrado el precio de ${name} en ${store} ${stats.count} ` +
      `${stats.count === 1 ? 'vez' : 'veces'} desde el ${formatDateEs(stats.firstDate)}. ` +
      `En ese periodo el precio publicado se movió entre ${formatPrice(stats.min)} ` +
      `(su valor más bajo, el ${formatDateEs(stats.minDate)}) y ${formatPrice(stats.max)} ` +
      `(el más alto, el ${formatDateEs(stats.maxDate)}).`,
  )

  if (stats.isAtLowest) {
    out.push(
      `El precio actual, ${formatPrice(stats.current)}, es el más bajo que hemos ` +
        `registrado para este producto. Suele ser una buena señal de oportunidad, ` +
        `pero confirma disponibilidad y condiciones antes de comprar.`,
    )
  } else {
    out.push(
      `El precio actual, ${formatPrice(stats.current)}, está ${stats.pctAboveMin}% por ` +
        `encima del mínimo registrado (${formatPrice(stats.min)}) y ${stats.pctBelowMax}% ` +
        `por debajo del máximo (${formatPrice(stats.max)}).`,
    )
  }

  if (stats.changeCount === 0) {
    out.push(
      `El precio se ha mantenido estable en ${formatPrice(stats.current)} durante ` +
        `todas las mediciones. Un precio plano por varias semanas sugiere que no es ` +
        `una oferta temporal.`,
    )
  } else if (stats.lastChange) {
    const lc = stats.lastChange
    const verb = lc.to > lc.from ? 'subió' : 'bajó'
    out.push(
      `El último cambio fue el ${formatDateEs(lc.date)}, cuando ${verb} de ` +
        `${formatPrice(lc.from)} a ${formatPrice(lc.to)}. En total ha cambiado de ` +
        `valor ${stats.changeCount} ${stats.changeCount === 1 ? 'vez' : 'veces'} ` +
        `en los últimos ${stats.spanDays} días.`,
    )
  }

  return out
}

/**
 * A product page is "thin" for indexing purposes when it has a single
 * retailer AND not enough price history to stand on its own. These get
 * `noindex` and stay out of the sitemap so the site isn't judged on
 * hundreds of near-empty pages.
 */
export function isThinProduct(
  storeCount: number,
  history: PricePoint[] | undefined,
): boolean {
  if (storeCount >= 2) return false
  const stats = analyzeHistory(history)
  return !stats || stats.count < 5
}

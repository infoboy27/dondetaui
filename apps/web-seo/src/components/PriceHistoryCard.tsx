import { analyzeHistory, describeHistory, formatDateEs, type HistoryStats } from '../lib/history'
import { formatPrice } from '../lib/format'
import { colors, fonts } from '../lib/tokens'
import type { PricePoint } from '../lib/types'

interface Props {
  history: PricePoint[] | undefined
  currentPrice: number
  name: string
  store: string
}

const W = 640
const H = 200
const PAD_X = 8
const PAD_Y = 18

function buildPaths(stats: HistoryStats) {
  const prices = stats.points.map(p => p.price)
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  const range = hi - lo || 1
  const n = stats.points.length

  const x = (i: number) => PAD_X + (i / Math.max(1, n - 1)) * (W - PAD_X * 2)
  const y = (price: number) => PAD_Y + (1 - (price - lo) / range) * (H - PAD_Y * 2)

  const line = stats.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${x(n - 1).toFixed(1)},${H - PAD_Y} L${x(0).toFixed(1)},${H - PAD_Y} Z`
  const last = { cx: x(n - 1), cy: y(stats.points[n - 1]!.price) }

  return { line, area, last }
}

/**
 * Server-rendered price-history section: an inline-SVG chart (no client JS),
 * a stat grid, and a few sentences of product-specific prose. Renders
 * nothing when there aren't at least 2 observations.
 */
export function PriceHistoryCard({ history, currentPrice, name, store }: Props) {
  const stats = analyzeHistory(history, currentPrice)
  if (!stats) return null

  const { line, area, last } = buildPaths(stats)
  const prose = describeHistory(stats, name, store, formatPrice)

  const stat = (label: string, value: string, sub?: string) => (
    <div style={{ padding: '10px 12px', background: colors.background, borderRadius: 10 }}>
      <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.navy400, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 700, color: colors.navy, marginTop: 2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.navy400, marginTop: 1 }}>{sub}</div>
      )}
    </div>
  )

  return (
    <section
      style={{ marginTop: 20, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16 }}
    >
      <h2 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.navy, margin: '0 0 4px' }}>
        Historial de precio
      </h2>
      <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy400, margin: '0 0 12px' }}>
        {stats.count} mediciones · del {formatDateEs(stats.firstDate)} al {formatDateEs(stats.lastDate)}
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Evolución del precio de ${name}: mínimo ${formatPrice(stats.min)}, máximo ${formatPrice(stats.max)}, actual ${formatPrice(stats.current)}.`}
        style={{ width: '100%', height: 160, display: 'block' }}
      >
        <path d={area} fill={colors.primaryLight} />
        <path d={line} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last.cx} cy={last.cy} r={4} fill={colors.primary} />
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.body, fontSize: 11, color: colors.navy400, margin: '4px 2px 16px' }}>
        <span>{formatDateEs(stats.firstDate)}</span>
        <span>{formatDateEs(stats.lastDate)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
        {stat('Precio actual', formatPrice(stats.current), stats.isAtLowest ? 'su valor más bajo' : `${stats.pctAboveMin}% sobre el mínimo`)}
        {stat('Mínimo registrado', formatPrice(stats.min), formatDateEs(stats.minDate))}
        {stat('Máximo registrado', formatPrice(stats.max), formatDateEs(stats.maxDate))}
        {stat(
          'Variación total',
          `${stats.change === 0 ? '' : stats.change > 0 ? '+' : '−'}${formatPrice(Math.abs(stats.change))}`,
          `${stats.count} mediciones en ${stats.spanDays} días`,
        )}
      </div>

      {prose.map((paragraph, i) => (
        <p key={i} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400, margin: i === 0 ? 0 : '10px 0 0' }}>
          {paragraph}
        </p>
      ))}
    </section>
  )
}

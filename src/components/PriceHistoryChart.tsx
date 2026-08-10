import { formatPrice } from '../data/mock'
import { colors, fonts } from '../design/tokens'

export interface PricePoint {
  date: string
  price: number
}

interface PriceHistoryChartProps {
  history: PricePoint[]
  period: string
}

export default function PriceHistoryChart({ history, period }: PriceHistoryChartProps) {
  const days = period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : period === '6M' ? 180 : 365
  const data = history.slice(-Math.min(days, history.length))

  if (!data.length) {
    return (
      <div style={{ padding: '28px 0', textAlign: 'center', color: '#9AAABB', fontFamily: fonts.body, fontSize: 12 }}>
        Aún no hay historial de precios.
      </div>
    )
  }

  const prices = data.map(point => point.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const current = prices[prices.length - 1]
  const avg = Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)

  const width = 320
  const height = 100
  const padding = 8
  const denominator = Math.max(1, data.length - 1)

  const points = data.map((point, index) => ({
    x: padding + (index / denominator) * (width - padding * 2),
    y: padding + ((max - point.price) / range) * (height - padding * 2),
  }))

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`
  const lowestPoint = points[prices.indexOf(min)]
  const latestPoint = points[points.length - 1]

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height + 4}`} style={{ overflow: 'visible', display: 'block' }} aria-label="Historial de precios">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGrad)" />
        <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {lowestPoint && (
          <circle cx={lowestPoint.x} cy={lowestPoint.y} r="4" fill={colors.accent} stroke="#fff" strokeWidth="2" />
        )}
        {latestPoint && (
          <circle cx={latestPoint.x} cy={latestPoint.y} r="4" fill={colors.primary} stroke="#fff" strokeWidth="2" />
        )}
      </svg>

      <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
        {[
          { label: 'Actual', value: current, color: colors.primary },
          { label: 'Mínimo', value: min, color: colors.accent },
          { label: 'Promedio', value: avg, color: '#9AAABB' },
          { label: 'Máximo', value: max, color: colors.navy },
        ].map((stat, index) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 4px',
              borderRight: index < 3 ? `1px solid ${colors.background}` : 'none',
            }}
          >
            <div style={{ fontSize: 11, color: '#9AAABB', fontFamily: fonts.body, marginBottom: 3 }}>
              {stat.label}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                fontFamily: fonts.display,
                color: stat.color,
                letterSpacing: '-0.02em',
              }}
            >
              {formatPrice(stat.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

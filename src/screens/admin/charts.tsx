import { colors, fonts } from '../../design/tokens'

const fmt = new Intl.NumberFormat('es-DO')
export const formatCount = (value: number) => fmt.format(value)

// Plain SVG column chart -- one series over days. No chart library: it has
// to print cleanly into the PDF proposal too.
export function DailyBars({ points, color = colors.primary, height = 140 }: {
  points: Array<{ date: string; value: number }>
  color?: string
  height?: number
}) {
  const max = Math.max(1, ...points.map(p => p.value))
  const width = 600
  const gap = points.length > 60 ? 1 : 2
  const barWidth = Math.max(1, width / Math.max(1, points.length) - gap)
  const first = points[0]?.date
  const last = points[points.length - 1]?.date

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Serie diaria">
        {points.map((p, i) => {
          const h = (p.value / max) * (height - 6)
          return (
            <rect key={p.date} x={i * (barWidth + gap)} y={height - h} width={barWidth} height={Math.max(h, p.value ? 2 : 0)} rx={1.5} fill={color}>
              <title>{`${p.date}: ${formatCount(p.value)}`}</title>
            </rect>
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.navy400, fontFamily: fonts.body, marginTop: 4 }}>
        <span>{first}</span>
        <span>máx. {formatCount(max)}/día</span>
        <span>{last}</span>
      </div>
    </div>
  )
}

// Horizontal share bars: label, bar, value.
export function ShareBars({ rows, color = colors.primary }: { rows: Array<{ label: string; value: number }>; color?: string }) {
  const max = Math.max(1, ...rows.map(r => r.value))
  if (!rows.length) return <Empty />
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {rows.map(row => (
        <div key={row.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 160px) 1fr auto', alignItems: 'center', gap: 10, fontFamily: fonts.body, fontSize: 13 }}>
          <span style={{ color: colors.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span>
          <div style={{ background: colors.navy50, borderRadius: 999, height: 10 }}>
            <div style={{ width: `${(row.value / max) * 100}%`, background: color, borderRadius: 999, height: 10 }} />
          </div>
          <strong style={{ color: colors.navy, minWidth: 40, textAlign: 'right' }}>{formatCount(row.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export function Empty({ text = 'Todavía no hay datos para este período.' }: { text?: string }) {
  return <div style={{ fontSize: 13, color: colors.navy400, fontFamily: fonts.body, padding: '12px 0' }}>{text}</div>
}

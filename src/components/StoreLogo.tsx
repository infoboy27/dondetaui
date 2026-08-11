import { STORE_LOGOS } from '../data/storeLogos'

interface Props {
  store: string
  abbr: string
  color: string
  size?: number
  borderRadius?: number
}

// Real logo when we have one for this retailer, otherwise the same
// color+initials badge used everywhere already -- so an unmapped real
// retailer (anything ingested beyond the 5 known chains) degrades
// gracefully instead of rendering nothing.
export default function StoreLogo({ store, abbr, color, size = 34, borderRadius = 10 }: Props) {
  const logo = STORE_LOGOS[abbr]

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        background: logo ? '#fff' : `${color}18`,
        border: `1.5px solid ${logo ? '#E8EDF2' : `${color}30`}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        padding: logo ? Math.round(size * 0.14) : 0,
        boxSizing: 'border-box',
      }}
    >
      {logo ? (
        <img src={logo} alt={store} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.32), fontWeight: 800, fontFamily: "'Poppins', sans-serif", color }}>
          {abbr}
        </span>
      )}
    </div>
  )
}

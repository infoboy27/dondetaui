import type { AdSize } from '../data/adSizes'

type Props = AdSize & { className?: string }

// Placeholder for a real ad slot. Shows the exact dimensions so it also
// works as a live spec sheet -- whoever ends up selling/designing these
// placements can read the required size straight off the page.
export default function AdBanner({ width, height, label, className }: Props) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        margin: '0 auto',
        borderRadius: 12,
        border: '1.5px dashed #D8E6F0',
        background: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <span style={{
        fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13,
        color: '#9AAABB',
      }}>
        Anúnciate aquí
      </span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#B0C4D8' }}>
        {width}×{height}px{label ? ` · ${label}` : ''}
      </span>
    </div>
  )
}

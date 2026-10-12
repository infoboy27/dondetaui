import { colors, fonts, radii } from '../design/tokens'

// Official Eneba logo (supplied and approved by Eneba for the Gaming section,
// 2026-10-12). Any new placement or artwork with their brand needs their
// approval again.
export default function EnebaBadge({ height = 20 }: { height?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#fff', border: `1px solid ${colors.border}`, borderRadius: radii.full,
      padding: '3px 10px 3px 12px', flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: colors.navy400, fontFamily: fonts.body, whiteSpace: 'nowrap' }}>En alianza con</span>
      <img src="/partners/eneba.png" alt="Eneba" height={height} style={{ height, width: 'auto', display: 'block' }} />
    </span>
  )
}

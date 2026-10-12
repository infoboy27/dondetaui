import { useState } from 'react'
import { colors, fonts, radii } from '../design/tokens'
import { ENEBA_DISCOUNT_CODE } from '../domain/gaming'
import { track } from '../analytics'

// The Eneba affiliate code (5% off). Text only: Eneba's terms require their
// written approval before their logo or brand artwork appears anywhere.
export default function DiscountCode({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ENEBA_DISCOUNT_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (old browser / insecure context): the code is on screen anyway.
    }
    track('copy_discount_code', { code: ENEBA_DISCOUNT_CODE, store: 'Eneba' })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: colors.primaryLight, border: `1.5px dashed ${colors.primary}`,
      borderRadius: radii.md, padding: compact ? '10px 12px' : '12px 14px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: colors.navy, fontFamily: fonts.body }}>
          5% de descuento en Eneba con el código
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: colors.navy, fontFamily: fonts.display, letterSpacing: '0.04em' }}>
          {ENEBA_DISCOUNT_CODE.toUpperCase()}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        style={{
          background: colors.primary, color: '#fff', border: 'none', cursor: 'pointer',
          borderRadius: radii.full, padding: '8px 14px', flexShrink: 0,
          fontSize: 12, fontWeight: 700, fontFamily: fonts.display,
        }}
      >
        {copied ? '¡Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}

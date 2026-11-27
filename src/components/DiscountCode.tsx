import { useState } from 'react'
import { colors, fonts, radii } from '../design/tokens'
import { ENEBA_DISCOUNT_CODE, activeEnebaPromo } from '../domain/gaming'
import { track } from '../analytics'

// The Eneba affiliate code (5% off), plus Eneba's own time-limited code while
// one runs (ENEBA_PROMOS). Their logo, where it appears, is EnebaBadge
// (approved by Eneba); new brand placements need their approval.
export default function DiscountCode({ compact = false }: { compact?: boolean }) {
  const promo = activeEnebaPromo()
  if (!promo) return <CodeRow code={ENEBA_DISCOUNT_CODE} label="5% de descuento en Eneba con el código" compact={compact} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CodeRow code={promo.code} label={promo.label} compact={compact} accent={colors.accent} />
      <CodeRow code={ENEBA_DISCOUNT_CODE} label="Todo el año: 5% en Eneba con el código" compact={compact} />
    </div>
  )
}

function CodeRow({ code, label, compact, accent = colors.primary }: { code: string; label: string; compact: boolean; accent?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (old browser / insecure context): the code is on screen anyway.
    }
    track('copy_discount_code', { code, store: 'Eneba' })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: accent === colors.primary ? colors.primaryLight : colors.accentLight, border: `1.5px dashed ${accent}`,
      borderRadius: radii.md, padding: compact ? '10px 12px' : '12px 14px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: colors.navy, fontFamily: fonts.body }}>
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: colors.navy, fontFamily: fonts.display, letterSpacing: '0.04em' }}>
          {code.toUpperCase()}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar el código ${code.toUpperCase()}`}
        style={{
          background: accent, color: '#fff', border: 'none', cursor: 'pointer',
          borderRadius: radii.full, padding: '8px 14px', flexShrink: 0,
          fontSize: 12, fontWeight: 700, fontFamily: fonts.display,
        }}
      >
        {copied ? '¡Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}

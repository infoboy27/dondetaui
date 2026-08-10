import type { HTMLAttributes } from 'react'
import { colors, fonts, radii } from '../../design/tokens'

type Tone = 'primary' | 'accent' | 'success' | 'error' | 'neutral'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

const toneStyles: Record<Tone, { background: string; color: string }> = {
  primary: { background: colors.primaryLight, color: colors.primary },
  accent: { background: colors.accentLight, color: colors.accent },
  success: { background: colors.primaryLight, color: colors.success },
  error: { background: '#FFF0F0', color: colors.error },
  neutral: { background: colors.background, color: colors.navy400 },
}

export default function Badge({ tone = 'neutral', style, ...props }: BadgeProps) {
  const toneStyle = toneStyles[tone]

  return (
    <span
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 20,
        padding: '2px 7px',
        borderRadius: radii.full,
        background: toneStyle.background,
        color: toneStyle.color,
        fontFamily: fonts.display,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        ...style,
      }}
    />
  )
}

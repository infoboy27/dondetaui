import type { HTMLAttributes } from 'react'
import { colors, radii, shadows } from '../../design/tokens'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export default function Card({ elevated = false, style, ...props }: CardProps) {
  return (
    <div
      {...props}
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow: elevated ? shadows.md : shadows.sm,
        ...style,
      }}
    />
  )
}

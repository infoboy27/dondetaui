import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import { colors, fonts, radii, shadows } from '../../design/tokens'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: colors.primary,
    color: colors.card,
    border: 'none',
    boxShadow: shadows.sm,
  },
  secondary: {
    background: colors.primaryLight,
    color: colors.primary,
    border: `1.5px solid ${colors.primary}`,
  },
  ghost: {
    background: 'transparent',
    color: colors.navy,
    border: `1px solid ${colors.border}`,
  },
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { minHeight: 36, padding: '8px 12px', fontSize: 12 },
  md: { minHeight: 44, padding: '10px 16px', fontSize: 13 },
  lg: { minHeight: 48, padding: '12px 18px', fontSize: 14 },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  style,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        width: fullWidth ? '100%' : undefined,
        borderRadius: radii.md,
        fontFamily: fonts.display,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
    />
  )
}

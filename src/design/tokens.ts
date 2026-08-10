export const colors = {
  primary: "#00B894",
  primaryLight: "#E6F7F3",
  primaryDark: "#009B7D",
  accent: "#FF9F1C",
  accentLight: "#FFF3E0",
  yellow: "#FFD166",
  navy: "#0F1D2D",
  navy600: "#2D4A6B",
  navy400: "#5D7EA0",
  navy200: "#B0C4D8",
  navy100: "#D8E6F0",
  navy50: "#F0F5F9",
  background: "#F2F4F7",
  card: "#FFFFFF",
  border: "#E8EDF2",
  success: "#00B894",
  warning: "#FF9F1C",
  error: "#FF3B3B",
} as const

export const fonts = {
  display: "'Poppins', sans-serif",
  body: "'DM Sans', sans-serif",
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const

export const shadows = {
  sm: "0 1px 3px rgba(15, 29, 45, 0.06), 0 1px 2px rgba(15, 29, 45, 0.04)",
  md: "0 4px 12px rgba(15, 29, 45, 0.08), 0 2px 4px rgba(15, 29, 45, 0.04)",
  lg: "0 8px 24px rgba(15, 29, 45, 0.10), 0 4px 8px rgba(15, 29, 45, 0.06)",
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
  page: 48,
  hero: 64,
} as const

export const breakpoints = {
  mobile: 390,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const

export const designTokens = {
  colors,
  fonts,
  radii,
  shadows,
  spacing,
  breakpoints,
} as const

export type DesignTokens = typeof designTokens

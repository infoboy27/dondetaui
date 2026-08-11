// Mirrors src/design/tokens.ts in the root app. Duplicated rather than
// imported: there's no pnpm workspace/shared package in this repo yet (see
// docs/ARCHITECTURE.md's packages/tokens as a long-term target, not built),
// and apps/api already follows the same "own standalone package" precedent.
export const colors = {
  primary: '#00B894',
  primaryLight: '#E6F7F3',
  accent: '#FF9F1C',
  navy: '#0F1D2D',
  navy400: '#5D7EA0',
  navy200: '#B0C4D8',
  background: '#F2F4F7',
  card: '#FFFFFF',
  border: '#E8EDF2',
} as const

export const fonts = {
  display: "'Poppins', sans-serif",
  body: "'DM Sans', sans-serif",
} as const

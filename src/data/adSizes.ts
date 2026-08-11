// Standard IAB ad unit sizes used across DóndeTa's ad placements. When
// reaching out to advertisers for artwork, request exactly these
// dimensions -- they're industry-standard, so most agencies/advertisers
// already have assets built for them.
export const AD_SIZES = {
  // Home screen, mobile: below "Categorías destacadas".
  mobileBanner: { width: 320, height: 50, label: 'Mobile Banner (IAB)' },
  // Home/results, desktop: top of the main content column.
  leaderboard: { width: 728, height: 90, label: 'Leaderboard (IAB)' },
  // Desktop sidebar, below the filters panel.
  mediumRectangle: { width: 300, height: 250, label: 'Medium Rectangle / MPU (IAB)' },
} as const

export type AdSize = (typeof AD_SIZES)[keyof typeof AD_SIZES]

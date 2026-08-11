import { Platform } from 'react-native'

// Translates the web tokens' CSS box-shadow strings (src/design/tokens.ts's
// `shadows.sm/md/lg`) into React Native's shadow properties. RN's shadow-*
// props only render on iOS; Android needs `elevation` instead, so both are
// set on every level and each platform picks up what it understands.
function shadow(offsetY: number, opacity: number, radius: number, elevation: number) {
  return Platform.select({
    android: { elevation },
    default: {
      shadowColor: '#0F1D2D',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  })
}

export const shadows = {
  sm: shadow(1, 0.06, 3, 2),
  md: shadow(4, 0.08, 12, 4),
  lg: shadow(8, 0.1, 24, 8),
} as const

import { Platform, type TextStyle } from 'react-native'
import { fonts } from './fonts'

// Text styles for the app. On iOS the UI uses the system font (SF Pro) and
// SF Pro Rounded for prices, sized like Apple's Dynamic Type text styles, so
// the app reads as native. Android keeps the brand fonts (DM Sans for text,
// Poppins for headings). Poppins stays on iOS only where the brand speaks:
// the home hero (`brand`).
const ios = Platform.OS === 'ios'

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy'

const IOS_WEIGHT: Record<Weight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
}

const ANDROID_BODY: Record<Weight, string> = {
  regular: fonts.body.regular,
  medium: fonts.body.medium,
  semibold: fonts.body.bold,
  bold: fonts.body.bold,
  heavy: fonts.body.bold,
}

const ANDROID_DISPLAY: Record<Weight, string> = {
  regular: fonts.display.semibold,
  medium: fonts.display.semibold,
  semibold: fonts.display.semibold,
  bold: fonts.display.bold,
  heavy: fonts.display.extrabold,
}

function text(size: number, lineHeight: number, weight: Weight, display = false): TextStyle {
  if (ios) return { fontSize: size, lineHeight, fontWeight: IOS_WEIGHT[weight] }
  return { fontSize: size, lineHeight, fontFamily: (display ? ANDROID_DISPLAY : ANDROID_BODY)[weight] }
}

// Prices: rounded, tabular digits so amounts line up in lists.
function price(size: number, weight: Weight = 'bold'): TextStyle {
  const base: TextStyle = { fontSize: size, lineHeight: Math.round(size * 1.2), fontVariant: ['tabular-nums'] }
  if (ios) return { ...base, fontFamily: 'ui-rounded', fontWeight: IOS_WEIGHT[weight] }
  return { ...base, fontFamily: ANDROID_DISPLAY[weight] }
}

export const type = {
  largeTitle: text(34, 41, 'bold', true),
  title1: text(28, 34, 'bold', true),
  title2: text(22, 28, 'bold', true),
  title3: text(20, 25, 'semibold', true),
  headline: text(17, 22, 'semibold'),
  body: text(17, 22, 'regular'),
  callout: text(16, 21, 'regular'),
  subheadline: text(15, 20, 'regular'),
  subheadlineEmphasized: text(15, 20, 'semibold'),
  footnote: text(13, 18, 'regular'),
  footnoteEmphasized: text(13, 18, 'semibold'),
  caption: text(12, 16, 'regular'),
  captionEmphasized: text(12, 16, 'semibold'),
  caption2: text(11, 13, 'medium'),
  price,
  // Brand voice (home hero): Poppins on both platforms.
  brand: { fontFamily: fonts.display.extrabold } as TextStyle,
} as const

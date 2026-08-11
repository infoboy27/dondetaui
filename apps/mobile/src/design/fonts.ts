import {
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'

// The web app's display/body fonts (docs/DESIGN_SYSTEM.md), narrowed to the
// weights actually used across src/screens/*.tsx's fontWeight values (400/
// 500 body text, 600-900 headings/prices). RN loads each weight as its own
// font family -- there's no single "Poppins" family with a fontWeight prop
// the way CSS works -- so this exports one family name per weight instead of
// a single string like the web tokens do.
export const fontsToLoad = {
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
}

export const fonts = {
  display: {
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    extrabold: 'Poppins_800ExtraBold',
    black: 'Poppins_900Black',
  },
  body: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    bold: 'DMSans_700Bold',
  },
} as const

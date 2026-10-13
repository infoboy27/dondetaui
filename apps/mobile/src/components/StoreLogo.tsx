import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { colors } from '../design/tokens'
import { type } from '../design/type'

// Same official logos as the web (src/data/storeLogos.ts, copied into
// assets/stores), keyed by retailer abbreviation. Retailers without a logo
// keep the tinted initials badge, like the web does.
const STORE_LOGOS: Record<string, number> = {
  PL: require('../../assets/stores/plaza-lama.png'),
  SI: require('../../assets/stores/sirena.webp'),
  CO: require('../../assets/stores/corripio.svg'),
  JU: require('../../assets/stores/jumbo.svg'),
  PS: require('../../assets/stores/pricesmart.png'),
}

export default function StoreLogo({ abbr, color, size = 56 }: { abbr: string; color: string; size?: number }) {
  const logo = STORE_LOGOS[abbr]
  const radius = size * 0.27

  if (logo) {
    return (
      <View
        style={[styles.badge, styles.logoBadge, { width: size, height: size, borderRadius: radius, padding: Math.round(size * 0.12) }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image source={logo} style={styles.logo} contentFit="contain" />
      </View>
    )
  }

  return (
    <View
      style={[styles.badge, { width: size, height: size, borderRadius: radius, backgroundColor: `${color}1F` }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[type.captionEmphasized, { fontSize: size * 0.34, lineHeight: size * 0.42, color }]}>{abbr}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous', overflow: 'hidden' },
  logoBadge: { backgroundColor: '#fff', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  logo: { width: '100%', height: '100%' },
})

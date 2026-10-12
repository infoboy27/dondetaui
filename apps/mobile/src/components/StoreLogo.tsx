import { StyleSheet, Text, View } from 'react-native'
import { type } from '../design/type'

// Mobile doesn't bundle the web app's local logo image assets (would mean
// duplicating LFS-tracked binaries into this app) -- a tinted rounded square
// with the store's abbreviation is the same graceful fallback the web app
// itself uses for any retailer it doesn't have a real logo image for.
export default function StoreLogo({ abbr, color, size = 56 }: { abbr: string; color: string; size?: number }) {
  return (
    <View
      style={[styles.badge, { width: size, height: size, borderRadius: size * 0.27, backgroundColor: `${color}1F` }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[type.captionEmphasized, { fontSize: size * 0.34, lineHeight: size * 0.42, color }]}>{abbr}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
})

import { StyleSheet, Text, View } from 'react-native'
import { fonts } from '../design/fonts'

// Mobile doesn't bundle the web app's local logo image assets (would mean
// duplicating LFS-tracked binaries into this app) -- a colored circle with
// the store's abbreviation is the same graceful fallback the web app itself
// uses for any retailer it doesn't have a real logo image for.
export default function StoreLogo({ abbr, color, size = 56 }: { abbr: string; color: string; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <Text style={{ fontSize: size * 0.32, fontFamily: fonts.display.black, color }}>{abbr}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
})

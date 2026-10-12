import { Image, StyleSheet, Text, View } from 'react-native'
import { colors, radii } from '../design/tokens'
import { type } from '../design/type'

// Official Eneba logo, approved by Eneba for the Gaming section (2026-10-12),
// same badge as the web. Any new placement with their brand needs their
// approval again.
const LOGO = require('../../assets/partners/eneba.png')
// assets/partners/eneba.png is 406x136 (Image.resolveAssetSource isn't on every platform).
const LOGO_RATIO = 406 / 136

export default function EnebaBadge({ logoHeight = 18 }: { logoHeight?: number }) {
  return (
    <View style={styles.badge}>
      <Text style={[type.caption, styles.text]}>En alianza con</Text>
      <Image source={LOGO} accessibilityLabel="Eneba" style={{ height: logoHeight, width: logoHeight * LOGO_RATIO }} />
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: radii.full,
    paddingVertical: 3, paddingLeft: 12, paddingRight: 10,
  },
  text: { color: colors.secondaryLabel },
})

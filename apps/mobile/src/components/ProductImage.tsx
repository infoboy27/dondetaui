import { useState } from 'react'
import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native'
import { colors, radii } from '../design/tokens'

// Mirrors the web app's ProductImage component (src/components/ProductImage.tsx):
// real product photos are sometimes missing or fail to load (ingested from
// retailer scrapes, not guaranteed) -- show a neutral placeholder instead of
// a broken-image icon or a blank box.
export default function ProductImage({ uri, style }: { uri?: string; style?: StyleProp<ImageStyle> }) {
  const [failed, setFailed] = useState(false)

  if (!uri || failed) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderGlyph}>📦</Text>
      </View>
    )
  }

  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} />
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.navy50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderGlyph: { fontSize: 28, opacity: 0.4 },
})

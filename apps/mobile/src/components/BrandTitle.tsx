import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { colors } from '../design/tokens'
import { fonts } from '../design/fonts'

const MARK = require('../../assets/brand/dondeta-mark.png')
// assets/brand/dondeta-mark.png is 197x240.
const MARK_RATIO = 197 / 240

// The DóndeTa mark + wordmark, as in the web header, for the home screen's
// navigation bar.
export default function BrandTitle() {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="DóndeTa">
      <Image source={MARK} style={{ height: 28, width: 28 * MARK_RATIO }} contentFit="contain" />
      <Text style={styles.word}>DóndeTa</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  word: { fontFamily: fonts.display.extrabold, fontSize: 20, letterSpacing: -0.5, color: colors.navy },
})

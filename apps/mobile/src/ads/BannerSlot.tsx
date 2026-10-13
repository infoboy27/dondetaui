import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'
import { AD_KEYWORDS, AdMob, adUnit, useAds } from './ads'

// An adaptive banner in a labeled card, placed at the end of a page. The
// card stays collapsed (zero height) until an ad loads, and disappears if
// none fills, so it never shows an empty frame.
export default function BannerSlot() {
  const { ready, personalized } = useAds()
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const unitId = adUnit('banner')

  if (!ready || !AdMob || !unitId || failed) return null
  const { BannerAd, BannerAdSize } = AdMob

  return (
    <View style={[styles.card, !loaded && styles.collapsed]}>
      {loaded && <Text style={[type.caption2, styles.label]}>Anuncio</Text>}
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: !personalized, keywords: AD_KEYWORDS }}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden', alignItems: 'center', paddingBottom: spacing.sm, marginTop: spacing.xxl },
  collapsed: { height: 0, marginTop: 0, paddingBottom: 0 },
  label: { alignSelf: 'flex-start', color: colors.tertiaryLabel, marginLeft: spacing.md, marginVertical: 6 },
})

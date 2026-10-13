import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { NativeAd } from 'react-native-google-mobile-ads'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'
import { AD_KEYWORDS, AdMob, adUnit, useAds } from './ads'

// A sponsored row shaped like ProductCard, clearly labeled "Anuncio". It
// renders nothing until an ad has loaded and nothing if none fills, so a
// missing ad never leaves a gap in the list.
export default function NativeAdCard() {
  const { ready, personalized } = useAds()
  const [ad, setAd] = useState<NativeAd | null>(null)

  useEffect(() => {
    const unitId = adUnit('native')
    if (!ready || !AdMob || !unitId) return
    let loaded: NativeAd | null = null
    let cancelled = false
    AdMob.NativeAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: !personalized, keywords: AD_KEYWORDS })
      .then(result => {
        if (cancelled) result.destroy()
        else {
          loaded = result
          setAd(result)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
      loaded?.destroy()
    }
  }, [ready, personalized])

  if (!ad || !AdMob) return null
  const { NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } = AdMob

  return (
    // The rounded clip lives on a wrapper: Android's native ad view ignores
    // borderRadius on itself.
    <View style={styles.card}>
      <NativeAdView nativeAd={ad} style={styles.inner}>
        <View style={styles.row}>
          <NativeMediaView style={styles.media} resizeMode="cover" />
          <View style={styles.body}>
            <View style={styles.labelRow}>
              <Text style={[type.caption2, styles.badge]}>Anuncio</Text>
              {!!ad.advertiser && (
                <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                  <Text style={[type.caption, styles.advertiser]} numberOfLines={1}>{ad.advertiser}</Text>
                </NativeAsset>
              )}
            </View>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={[type.subheadlineEmphasized, styles.headline]} numberOfLines={2}>{ad.headline}</Text>
            </NativeAsset>
            {!!ad.body && (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text style={[type.caption, styles.text]} numberOfLines={2}>{ad.body}</Text>
              </NativeAsset>
            )}
            {!!ad.callToAction && (
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <Text style={[type.footnoteEmphasized, styles.cta]}>{ad.callToAction}</Text>
              </NativeAsset>
            )}
          </View>
        </View>
      </NativeAdView>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden', marginBottom: spacing.sm },
  inner: { padding: spacing.md, backgroundColor: colors.card },
  row: { flexDirection: 'row', gap: spacing.md },
  media: { width: 84, height: 84, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.navy50 },
  body: { flex: 1, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { color: colors.secondaryLabel, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.tertiaryLabel, borderRadius: 4, paddingHorizontal: 4, overflow: 'hidden' },
  advertiser: { color: colors.tertiaryLabel, flexShrink: 1 },
  headline: { color: colors.navy },
  text: { color: colors.secondaryLabel },
  cta: { alignSelf: 'flex-start', color: colors.primaryDark, backgroundColor: colors.primaryLight, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
})

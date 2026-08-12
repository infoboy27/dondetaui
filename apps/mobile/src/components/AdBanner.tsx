import { StyleSheet, View } from 'react-native'

type AdMobModule = typeof import('react-native-google-mobile-ads')

// Native module -- not available in Expo Go. A static `import ... from
// 'react-native-google-mobile-ads'` throws immediately there, before any of
// our own code runs, and that's hoisted so no try/catch placed after it can
// ever catch it -- only a plain `require()` call, as a normal statement,
// can be wrapped (same reasoning as usePushNotifications.ts).
let AdMob: AdMobModule | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AdMob = require('react-native-google-mobile-ads')
} catch {
  AdMob = null
}

// Real AdMob App IDs (apps/mobile/app.json) are still Google's public test
// ids until a real AdMob account/app is created, so this also falls back to
// TestIds.BANNER whenever no production ad unit id is configured -- swap in
// EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_ANDROID once that's ready.
const PRODUCTION_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_ANDROID

export default function AdBanner() {
  if (!AdMob) return null

  const { BannerAd, BannerAdSize, TestIds } = AdMob
  const unitId = __DEV__ || !PRODUCTION_BANNER_UNIT_ID ? TestIds.BANNER : PRODUCTION_BANNER_UNIT_ID

  return (
    <View style={styles.container}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
})

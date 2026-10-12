// Ads are off for now. The AdMob integration (react-native-google-mobile-ads)
// was removed on 2026-10-11: there is no AdMob account yet, so it only ever
// showed Google's test ads, and v16.4.0 pins play-services-ads 25.4.0, whose
// Kotlin 2.3 metadata breaks the release build (Expo SDK 57 compiles with
// Kotlin 2.1; setting kotlinVersion via expo-build-properties didn't reach
// that module). To bring ads back once an AdMob app exists: reinstall a
// version compatible with the SDK's Kotlin, restore its config plugin in
// app.json with the real app id, and render <BannerAd> here (git history has
// the previous implementation, including the Expo Go require() guard).
export default function AdBanner() {
  return null
}

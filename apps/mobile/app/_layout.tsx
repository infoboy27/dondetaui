import { useCallback, useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { fontsToLoad } from '../src/design/fonts'
import { AppStateProvider } from '../src/state/AppStateContext'
import { nativeHeader } from '../src/design/navigation'
import { initAds } from '../src/ads/ads'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad)

  // Consent + ads SDK start once the UI is up (never blocks the app).
  useEffect(() => {
    if (fontsLoaded || fontError) void initAds()
  }, [fontsLoaded, fontError])

  const onLayout = useCallback(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <AppStateProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={nativeHeader}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[slug]" options={{ title: '' }} />
            <Stack.Screen name="store/[slug]" options={{ title: '', headerLargeTitle: true }} />
            <Stack.Screen name="nearby-stores" options={{ title: 'Tiendas cercanas', headerLargeTitle: true }} />
            <Stack.Screen name="gaming" options={{ title: 'Gaming', headerLargeTitle: true }} />
            <Stack.Screen name="auth" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

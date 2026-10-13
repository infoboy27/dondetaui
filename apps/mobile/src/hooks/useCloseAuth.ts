import { useNavigation } from 'expo-router'

// Closes the whole sign-in sheet (app/auth/*), however deep in it we are,
// and returns to where the user opened it.
export function useCloseAuth() {
  const navigation = useNavigation()
  return () => {
    const parent = navigation.getParent()
    if (parent?.canGoBack()) parent.goBack()
    else if (navigation.canGoBack()) navigation.goBack()
  }
}

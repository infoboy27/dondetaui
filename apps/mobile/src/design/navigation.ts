import { Platform } from 'react-native'
import type { ComponentProps } from 'react'
import type { Stack } from 'expo-router'
import { colors } from './tokens'
import { fonts } from './fonts'

type StackOptions = NonNullable<ComponentProps<typeof Stack>['screenOptions']>

const ios = Platform.OS === 'ios'

// Native headers shared by every stack: iOS large titles that collapse on
// scroll into a translucent bar, the back button as a bare chevron, brand tint.
export const nativeHeader: StackOptions = {
  headerTintColor: colors.primaryDark,
  headerBackButtonDisplayMode: 'minimal',
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerTransparent: ios,
  headerStyle: ios ? undefined : { backgroundColor: colors.background },
  headerTitleStyle: ios ? { color: colors.navy } : { color: colors.navy, fontFamily: fonts.display.bold },
  headerLargeTitleStyle: ios ? { color: colors.navy } : undefined,
  contentStyle: { backgroundColor: colors.background },
}

export const largeTitleHeader: StackOptions = {
  ...nativeHeader,
  headerLargeTitle: true,
}

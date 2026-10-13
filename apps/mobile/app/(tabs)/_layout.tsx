import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { colors } from '../../src/design/tokens'
import { iconSymbol } from '../../src/components/Icon'

// The system tab bar (Liquid Glass on iOS 26+, Material on Android) with SF
// Symbols / Material Symbols. "Buscar" takes the search role, so iOS shows
// it as its own search button next to the bar.
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.primary} minimizeBehavior="onScrollDown" labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: iconSymbol('home').ios, selected: iconSymbol('homeFill').ios }} md={iconSymbol('home').android} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scanner">
        <NativeTabs.Trigger.Label>Escanear</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={iconSymbol('scan').ios} md={iconSymbol('scan').android} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <NativeTabs.Trigger.Label>Guardados</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: iconSymbol('heart').ios, selected: iconSymbol('heartFill').ios }} md={iconSymbol('heart').android} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: iconSymbol('person').ios, selected: iconSymbol('personFill').ios }} md={iconSymbol('person').android} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={iconSymbol('search').ios} md={iconSymbol('search').android} />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

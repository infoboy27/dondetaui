import { Tabs } from 'expo-router'
import { Text, type ColorValue } from 'react-native'
import { colors } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.navy400,
        tabBarLabelStyle: { fontFamily: fonts.body.medium, fontSize: 11 },
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <TabIcon symbol="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Buscar', tabBarIcon: ({ color }) => <TabIcon symbol="🔍" color={color} /> }}
      />
      <Tabs.Screen
        name="scanner"
        options={{ title: 'Escanear', tabBarIcon: ({ color }) => <TabIcon symbol="▦" color={color} /> }}
      />
      <Tabs.Screen
        name="alerts"
        options={{ title: 'Alertas', tabBarIcon: ({ color }) => <TabIcon symbol="🔔" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: ({ color }) => <TabIcon symbol="👤" color={color} /> }}
      />
    </Tabs>
  )
}

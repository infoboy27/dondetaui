import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import type { StoreBranch } from '../api/stores'
import { colors, spacing } from '../design/tokens'
import { type } from '../design/type'
import StoreLogo from './StoreLogo'
import Icon from './Icon'
import Touchable from './ui/Touchable'

// One branch in a grouped list; tapping opens directions in the platform's
// maps app (Apple Maps on iOS).
export default function StoreBranchRow({ branch, divider = false }: { branch: StoreBranch; divider?: boolean }) {
  const hasCoords = branch.latitude !== null && branch.longitude !== null

  const openMaps = () => {
    if (!hasCoords) return
    const label = encodeURIComponent(branch.name)
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?q=${label}&ll=${branch.latitude},${branch.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
    void Linking.openURL(url)
  }

  const distance = branch.distanceKm === undefined
    ? null
    : branch.distanceKm < 1 ? `${Math.round(branch.distanceKm * 1000)} m` : `${branch.distanceKm.toLocaleString('es-DO', { maximumFractionDigits: 1 })} km`

  return (
    <View>
      <Touchable
        onPress={openMaps}
        disabled={!hasCoords}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`${branch.name}${distance ? `, a ${distance}` : ''}. Abrir en Mapas`}
      >
        <StoreLogo abbr={branch.retailer.abbr} color={branch.retailer.color} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, styles.name]} numberOfLines={1}>{branch.name}</Text>
          {!!branch.address && <Text style={[type.footnote, styles.address]} numberOfLines={2}>{branch.address}</Text>}
        </View>
        {distance && <Text style={[type.subheadlineEmphasized, styles.distance]}>{distance}</Text>}
        {hasCoords && <Icon name="chevronRight" size={13} color={colors.tertiaryLabel} weight="semibold" />}
      </Touchable>
      {divider && <View style={styles.separator} />}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  name: { color: colors.navy },
  address: { color: colors.secondaryLabel, marginTop: 1 },
  distance: { color: colors.primaryDark },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 72 },
})

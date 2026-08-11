import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import type { StoreBranch } from '../api/stores'
import { colors, radii, spacing } from '../design/tokens'
import { fonts } from '../design/fonts'

export default function StoreBranchRow({ branch }: { branch: StoreBranch }) {
  const openMaps = () => {
    if (branch.latitude === null || branch.longitude === null) return
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`)
  }

  return (
    <Pressable onPress={openMaps} disabled={branch.latitude === null} style={styles.row}>
      <View style={[styles.badge, { backgroundColor: branch.retailer.color }]}>
        <Text style={styles.badgeText}>{branch.retailer.abbr}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{branch.name}</Text>
        {!!branch.address && <Text style={styles.address} numberOfLines={2}>{branch.address}</Text>}
      </View>
      {branch.distanceKm !== undefined && (
        <Text style={styles.distance}>{branch.distanceKm < 1 ? `${Math.round(branch.distanceKm * 1000)} m` : `${branch.distanceKm} km`}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  badge: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontFamily: fonts.display.black, fontSize: 12 },
  name: { color: colors.navy, fontFamily: fonts.display.bold, fontSize: 14 },
  address: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 12, marginTop: 2 },
  distance: { color: colors.primary, fontFamily: fonts.display.bold, fontSize: 13 },
})

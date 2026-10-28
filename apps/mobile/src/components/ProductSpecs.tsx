import { StyleSheet, Text, View } from 'react-native'
import { specEntries } from '../domain/specs'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'

export default function ProductSpecs({ specs }: { specs?: Record<string, string> }) {
  const entries = specEntries(specs)
  if (!entries.length) return null

  return (
    <View>
      <Text style={[type.title3, styles.title]} accessibilityRole="header">Características</Text>
      <View style={styles.card}>
        {entries.map((entry, index) => (
          <View key={entry.label} style={[styles.row, index < entries.length - 1 && styles.rowDivider]}>
            <Text style={[type.subheadline, styles.label]}>{entry.label}</Text>
            <Text style={[type.subheadline, styles.value]}>{entry.value}</Text>
          </View>
        ))}
      </View>
      <Text style={[type.footnote, styles.note]}>Según lo que publican las tiendas. Confírmalo antes de comprar.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { color: colors.navy, marginTop: spacing.xxl, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  label: { color: colors.secondaryLabel, flex: 1 },
  value: { color: colors.navy, flex: 1, textAlign: 'right', fontWeight: '600' },
  note: { color: colors.tertiaryLabel, marginTop: spacing.sm },
})

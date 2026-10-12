import { Children, isValidElement, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../../design/tokens'
import { type } from '../../design/type'
import Icon, { type IconName } from '../Icon'
import Touchable from './Touchable'

// iOS "inset grouped" list (Settings app): rounded sections of rows with
// hairline separators, an optional header above and footer below.
export function ListSection({ header, footer, children }: { header?: string; footer?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement)
  return (
    <View style={styles.section}>
      {!!header && <Text style={[type.footnote, styles.header]}>{header.toUpperCase()}</Text>}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={row.key ?? index}>
            {row}
            {index < rows.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
      {!!footer && <Text style={[type.footnote, styles.footer]}>{footer}</Text>}
    </View>
  )
}

export function ListRow({
  icon,
  iconColor = colors.primary,
  title,
  value,
  onPress,
  destructive = false,
  external = false,
  accessibilityLabel,
}: {
  icon?: IconName
  iconColor?: string
  title: string
  value?: string
  onPress?: () => void
  destructive?: boolean
  external?: boolean
  accessibilityLabel?: string
}) {
  const content = (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.iconTile, { backgroundColor: iconColor }]}>
          <Icon name={icon} size={15} color="#fff" weight="semibold" />
        </View>
      )}
      <Text style={[type.body, styles.title, destructive && styles.destructive]} numberOfLines={1}>{title}</Text>
      {!!value && <Text style={[type.body, styles.value]} numberOfLines={1}>{value}</Text>}
      {onPress && !destructive && (
        <Icon name={external ? 'arrowUpRight' : 'chevronRight'} size={13} color={colors.tertiaryLabel} weight="semibold" />
      )}
    </View>
  )
  if (!onPress) return content
  return (
    <Touchable onPress={onPress} accessibilityRole={external ? 'link' : 'button'} accessibilityLabel={accessibilityLabel ?? title}>
      {content}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xxl },
  header: { color: colors.secondaryLabel, marginLeft: spacing.lg, marginBottom: 6 },
  footer: { color: colors.secondaryLabel, marginHorizontal: spacing.lg, marginTop: 6 },
  card: { backgroundColor: colors.card, borderRadius: radii.md, borderCurve: 'continuous', overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 56 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.lg },
  iconTile: { width: 28, height: 28, borderRadius: 7, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.navy },
  destructive: { color: '#E5383B', textAlign: 'center' },
  value: { color: colors.secondaryLabel, maxWidth: '50%' },
})

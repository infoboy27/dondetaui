import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../../design/tokens'
import { type } from '../../design/type'
import Icon from '../Icon'
import Touchable from './Touchable'

// Section title with an optional subtitle and "Ver todo" link, like the
// shelves in the App Store.
export default function SectionHeader({
  title,
  subtitle,
  actionTitle,
  onAction,
  count,
}: {
  title: string
  subtitle?: string
  actionTitle?: string
  onAction?: () => void
  count?: number
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[type.title3, styles.title]} accessibilityRole="header">
          {title}
          {count !== undefined && <Text style={[type.title3, styles.count]}>  {count.toLocaleString('es-DO')}</Text>}
        </Text>
        {!!subtitle && <Text style={[type.footnote, styles.subtitle]}>{subtitle}</Text>}
      </View>
      {!!actionTitle && onAction && (
        <Touchable onPress={onAction} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${actionTitle}: ${title}`} style={styles.action}>
          <Text style={[type.subheadline, styles.actionText]}>{actionTitle}</Text>
          <Icon name="chevronRight" size={12} color={colors.primaryDark} weight="semibold" />
        </Touchable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.md },
  title: { color: colors.navy },
  count: { color: colors.tertiaryLabel },
  subtitle: { color: colors.secondaryLabel, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 2 },
  actionText: { color: colors.primaryDark },
})

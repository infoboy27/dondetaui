import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../../design/tokens'
import { type } from '../../design/type'
import Icon, { type IconName } from '../Icon'
import Button from './Button'

// Centered icon + message for empty lists, errors and permission prompts,
// in the style of iOS's ContentUnavailableView.
export default function EmptyState({
  icon,
  title,
  message,
  actionTitle,
  onAction,
  secondaryTitle,
  onSecondary,
  tone = 'neutral',
}: {
  icon: IconName
  title: string
  message?: string
  actionTitle?: string
  onAction?: () => void
  secondaryTitle?: string
  onSecondary?: () => void
  tone?: 'neutral' | 'brand' | 'warning'
}) {
  const tint = tone === 'brand' ? colors.primary : tone === 'warning' ? colors.accent : colors.tertiaryLabel

  return (
    <View style={styles.wrap}>
      <Icon name={icon} size={44} color={tint} weight="regular" />
      <Text style={[type.title3, styles.title]}>{title}</Text>
      {!!message && <Text style={[type.subheadline, styles.message]}>{message}</Text>}
      {!!actionTitle && onAction && <Button title={actionTitle} onPress={onAction} style={styles.action} />}
      {!!secondaryTitle && onSecondary && <Button title={secondaryTitle} onPress={onSecondary} variant="plain" />}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: spacing.xxxl, paddingVertical: spacing.page, gap: spacing.sm },
  title: { color: colors.navy, textAlign: 'center', marginTop: spacing.sm },
  message: { color: colors.secondaryLabel, textAlign: 'center' },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
})

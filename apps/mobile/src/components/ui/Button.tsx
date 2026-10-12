import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, spacing } from '../../design/tokens'
import { type } from '../../design/type'
import Icon, { type IconName } from '../Icon'
import Touchable from './Touchable'

type Variant = 'filled' | 'tinted' | 'plain'

// Capsule buttons in the three iOS styles: filled (primary action), tinted
// (secondary) and plain (text-only).
export default function Button({
  title,
  onPress,
  variant = 'filled',
  icon,
  loading = false,
  disabled = false,
  size = 'large',
  style,
  accessibilityLabel,
}: {
  title: string
  onPress: () => void
  variant?: Variant
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  size?: 'large' | 'small'
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const fg = variant === 'filled' ? '#fff' : colors.primaryDark
  const inactive = disabled || loading

  return (
    <Touchable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        size === 'small' ? styles.small : styles.large,
        variant === 'filled' && styles.filled,
        variant === 'tinted' && styles.tinted,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Icon name={icon} size={size === 'small' ? 14 : 17} color={fg} weight="semibold" />}
          <Text style={[size === 'small' ? type.footnoteEmphasized : type.headline, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  large: { minHeight: 50, paddingHorizontal: spacing.xl },
  small: { minHeight: 32, paddingHorizontal: 14 },
  filled: { backgroundColor: colors.primary },
  tinted: { backgroundColor: colors.primaryLight },
  disabled: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
})

import { forwardRef, useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, radii, spacing } from '../../design/tokens'
import { type } from '../../design/type'
import Icon from '../Icon'
import Touchable from './Touchable'

// Grouped form fields in the iOS style: rows inside one rounded card,
// separated by hairlines. Wrap rows in <FieldGroup>.
export function FieldGroup({ children, footer }: { children: React.ReactNode; footer?: string }) {
  return (
    <View style={styles.groupWrap}>
      <View style={styles.group}>{children}</View>
      {!!footer && <Text style={[type.footnote, styles.footer]}>{footer}</Text>}
    </View>
  )
}

export function FieldSeparator() {
  return <View style={styles.separator} />
}

export const TextField = forwardRef<TextInput, TextInputProps>(function TextField({ style, ...props }, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.tertiaryLabel}
      style={[type.body, styles.input, style]}
      {...props}
    />
  )
})

// Password with a show/hide toggle. `isNew` picks the right autofill hints
// (iOS suggests a strong password for new ones).
export const PasswordField = forwardRef<TextInput, TextInputProps & { isNew?: boolean }>(function PasswordField(
  { isNew = false, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  return (
    <View style={styles.row}>
      <TextField
        ref={ref}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={isNew ? 'newPassword' : 'password'}
        autoComplete={isNew ? 'new-password' : 'current-password'}
        passwordRules={isNew ? 'minlength: 8;' : undefined}
        style={styles.flex}
        {...props}
      />
      <Touchable
        onPress={() => setVisible(v => !v)}
        hitSlop={10}
        style={styles.eye}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Icon name={visible ? 'eyeSlash' : 'eye'} size={18} color={colors.tertiaryLabel} />
      </Touchable>
    </View>
  )
})

// Six-digit one-time code. iOS offers to fill it from Mail/Messages
// (oneTimeCode); it submits by itself when the sixth digit is typed.
export function CodeField({ value, onChange, onComplete, autoFocus = true }: {
  value: string
  onChange: (code: string) => void
  onComplete?: (code: string) => void
  autoFocus?: boolean
}) {
  return (
    <TextInput
      value={value}
      onChangeText={text => {
        const digits = text.replace(/\D/g, '').slice(0, 6)
        onChange(digits)
        if (digits.length === 6) onComplete?.(digits)
      }}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
      maxLength={6}
      autoFocus={autoFocus}
      placeholder="000000"
      placeholderTextColor={colors.navy200}
      style={[type.price(34, 'bold'), styles.code]}
      accessibilityLabel="Código de 6 dígitos"
    />
  )
}

const styles = StyleSheet.create({
  groupWrap: { marginBottom: spacing.lg },
  group: { backgroundColor: colors.card, borderRadius: radii.md, borderCurve: 'continuous', overflow: 'hidden' },
  footer: { color: colors.secondaryLabel, marginHorizontal: spacing.lg, marginTop: 6 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: spacing.lg },
  // letterSpacing 0 explicitly: otherwise RN (Fabric) can carry the code
  // field's wide spacing over to these fields' placeholders.
  input: { minHeight: 50, paddingHorizontal: spacing.lg, color: colors.navy, letterSpacing: 0 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  eye: { paddingHorizontal: spacing.lg, minHeight: 50, justifyContent: 'center' },
  code: {
    textAlign: 'center', letterSpacing: 12, color: colors.navy, backgroundColor: colors.card,
    borderRadius: radii.lg, borderCurve: 'continuous', paddingVertical: spacing.lg, marginBottom: spacing.lg,
  },
})

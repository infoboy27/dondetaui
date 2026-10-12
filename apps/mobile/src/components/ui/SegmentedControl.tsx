import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../../design/tokens'
import { type } from '../../design/type'
import { haptics } from '../../design/haptics'
import Touchable from './Touchable'

// iOS-style segmented control: a sunken track with the selected segment
// raised on a white thumb.
export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {segments.map(segment => {
        const selected = segment.value === value
        return (
          <Touchable
            key={segment.value}
            feedback="none"
            onPress={() => {
              if (selected) return
              haptics.selection()
              onChange(segment.value)
            }}
            style={[styles.segment, selected && styles.selected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[selected ? type.footnoteEmphasized : type.footnote, styles.label]}>{segment.label}</Text>
          </Touchable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.fillStrong, borderRadius: 9, padding: 2, marginBottom: spacing.lg },
  segment: { flex: 1, minHeight: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  selected: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  label: { color: colors.navy },
})

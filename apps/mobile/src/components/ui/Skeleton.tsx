import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radii, spacing } from '../../design/tokens'

// Content-shaped placeholders that gently pulse while data loads -- they
// keep the layout steady instead of a spinner followed by a jump.
export function Skeleton({ width, height, radius = 6, style }: { width: DimensionValue; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.55)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.fillStrong, opacity }, style]} />
}

// Placeholder for a ProductCard row.
export function ProductRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={84} height={84} radius={radii.md} />
      <View style={styles.lines}>
        <Skeleton width="35%" height={11} />
        <Skeleton width="90%" height={15} />
        <Skeleton width="60%" height={15} />
        <Skeleton width="40%" height={20} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  )
}

// Placeholder for a DealCard in a horizontal shelf.
export function DealCardSkeleton() {
  return (
    <View style={styles.deal}>
      <Skeleton width="100%" height={128} radius={0} />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <Skeleton width="90%" height={13} />
        <Skeleton width="55%" height={13} />
        <Skeleton width="50%" height={19} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', marginBottom: spacing.sm },
  lines: { flex: 1, gap: 8, justifyContent: 'center' },
  deal: { width: 176, backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden' },
})

import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

// Pressable with the press feedback iOS controls have: content dims (and,
// for cards, shrinks a touch) while the finger is down. Use it instead of a
// bare Pressable so every tappable thing in the app responds the same way.
export default function Touchable({
  style,
  feedback = 'dim',
  ...props
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; feedback?: 'dim' | 'scale' | 'none' }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        style,
        pressed && feedback === 'dim' && { opacity: 0.55 },
        pressed && feedback === 'scale' && { opacity: 0.9, transform: [{ scale: 0.975 }] },
      ]}
    />
  )
}

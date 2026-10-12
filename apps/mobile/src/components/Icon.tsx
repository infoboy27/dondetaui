import { SymbolView, type AndroidSymbol, type SFSymbol, type SymbolWeight } from 'expo-symbols'
import type { ColorValue, StyleProp, ViewStyle } from 'react-native'
import { colors } from '../design/tokens'

// One name per icon used in the app: SF Symbols on iOS, the matching
// Material Symbol on Android. Add new icons here rather than inline, so both
// platforms always have one.
const ICONS = {
  home: { ios: 'house', android: 'home' },
  homeFill: { ios: 'house.fill', android: 'home' },
  search: { ios: 'magnifyingglass', android: 'search' },
  scan: { ios: 'barcode.viewfinder', android: 'barcode_scanner' },
  bell: { ios: 'bell', android: 'notifications' },
  bellFill: { ios: 'bell.fill', android: 'notifications_active' },
  heart: { ios: 'heart', android: 'favorite' },
  heartFill: { ios: 'heart.fill', android: 'favorite' },
  person: { ios: 'person.crop.circle', android: 'account_circle' },
  personFill: { ios: 'person.crop.circle.fill', android: 'account_circle' },
  location: { ios: 'location.fill', android: 'location_on' },
  mappin: { ios: 'mappin.and.ellipse', android: 'pin_drop' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  arrowUpRight: { ios: 'arrow.up.right', android: 'arrow_outward' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  flash: { ios: 'flashlight.off.fill', android: 'flashlight_off' },
  flashOn: { ios: 'flashlight.on.fill', android: 'flashlight_on' },
  keyboard: { ios: 'keyboard', android: 'keyboard' },
  clock: { ios: 'clock.arrow.circlepath', android: 'history' },
  close: { ios: 'xmark', android: 'close' },
  closeCircle: { ios: 'xmark.circle.fill', android: 'cancel' },
  tag: { ios: 'tag.fill', android: 'sell' },
  trendDown: { ios: 'chart.line.downtrend.xyaxis', android: 'trending_down' },
  gamecontroller: { ios: 'gamecontroller.fill', android: 'sports_esports' },
  storefront: { ios: 'storefront.fill', android: 'storefront' },
  shippingbox: { ios: 'shippingbox', android: 'inventory_2' },
  copy: { ios: 'doc.on.doc', android: 'content_copy' },
  checkmark: { ios: 'checkmark', android: 'check' },
  checkmarkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  wifiSlash: { ios: 'wifi.slash', android: 'wifi_off' },
  exclamation: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  star: { ios: 'star', android: 'star' },
  starFill: { ios: 'star.fill', android: 'star' },
  donate: { ios: 'heart.circle.fill', android: 'volunteer_activism' },
  chat: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum' },
  lock: { ios: 'lock.shield.fill', android: 'shield_lock' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  bolt: { ios: 'bolt.fill', android: 'bolt' },
  photo: { ios: 'photo', android: 'image' },
} satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>

export type IconName = keyof typeof ICONS

export function iconSymbol(name: IconName) {
  return ICONS[name]
}

export default function Icon({
  name,
  size = 20,
  color = colors.navy,
  weight = 'medium',
  style,
}: {
  name: IconName
  size?: number
  color?: ColorValue
  weight?: SymbolWeight
  style?: StyleProp<ViewStyle>
}) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
    />
  )
}

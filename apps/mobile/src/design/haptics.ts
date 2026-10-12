import * as Haptics from 'expo-haptics'

// Subtle, iOS-style feedback. Every call is fire-and-forget: devices without
// a Taptic Engine (and the simulator) simply do nothing.
export const haptics = {
  // Toggling something on/off: favorite, alert, filter chip.
  selection: () => void Haptics.selectionAsync().catch(() => {}),
  // A light physical tap: opening a card, pressing a primary button.
  light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  // Something worked: barcode recognized, code copied.
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  // Something didn't: unknown barcode, failed request.
  warning: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
}

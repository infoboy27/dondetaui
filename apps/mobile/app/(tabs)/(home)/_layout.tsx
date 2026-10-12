import { Stack } from 'expo-router'
import { largeTitleHeader } from '../../../src/design/navigation'

export default function TabStack() {
  return <Stack screenOptions={largeTitleHeader} />
}

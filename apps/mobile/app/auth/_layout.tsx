import { Stack } from 'expo-router'
import { nativeHeader } from '../../src/design/navigation'

// Sign-in, sign-up, password recovery, two-step sign-in and email
// confirmation, presented as one sheet (root layout: presentation 'modal').
export default function AuthStack() {
  return <Stack screenOptions={{ ...nativeHeader, headerTransparent: false, headerStyle: { backgroundColor: '#F2F4F7' } }} />
}

import { useWindowDimensions } from 'react-native'
import { columnsForWidth, isWide } from '../domain/grid'

/** Product-list columns for the current window; updates when it is resized (foldable opened, split view). */
export function useColumns(): number {
  return columnsForWidth(useWindowDimensions().width)
}

/** True when the window is wide enough for side-by-side layouts. */
export function useIsWide(): boolean {
  return isWide(useWindowDimensions().width)
}

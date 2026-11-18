import type { FeedItem } from './feed'

// Wide windows (the foldable iPhone opened, split view, Stage Manager) show
// product lists as a grid instead of one stretched column. Width in points,
// from useWindowDimensions, so it follows the window as it is resized.
// Pure (no RN) so it runs in the root vitest suite.

/** Any window narrower than this keeps the one-column phone list. */
export const GRID_MIN_WIDTH = 640
/** Side-by-side product page needs room for a full store row in each half. */
export const SPLIT_MIN_WIDTH = 760

export function columnsForWidth(width: number): number {
  if (width >= 1000) return 3
  if (width >= GRID_MIN_WIDTH) return 2
  return 1
}

export function isWide(width: number): boolean {
  return width >= SPLIT_MIN_WIDTH
}

export type GridRow<T> = { kind: 'items'; key: string; items: T[] } | { kind: 'ad'; key: string }

/**
 * Groups a feed into rows of `columns` items. An ad takes a row of its own
 * (it flushes the row in progress), so it never squeezes into a cell.
 */
export function gridRows<T>(feed: FeedItem<T>[], columns: number, keyOf: (item: T) => string): GridRow<T>[] {
  const size = Math.max(1, Math.floor(columns))
  const rows: GridRow<T>[] = []
  let current: T[] = []
  const flush = () => {
    if (!current.length) return
    rows.push({ kind: 'items', key: current.map(keyOf).join('|'), items: current })
    current = []
  }
  for (const entry of feed) {
    if (entry.kind === 'ad') {
      flush()
      rows.push({ kind: 'ad', key: entry.key })
      continue
    }
    current.push(entry.item)
    if (current.length === size) flush()
  }
  flush()
  return rows
}

/** gridRows for a plain list (no ads). */
export function listRows<T>(items: T[], columns: number, keyOf: (item: T) => string): GridRow<T>[] {
  return gridRows(items.map(item => ({ kind: 'item' as const, item })), columns, keyOf)
}

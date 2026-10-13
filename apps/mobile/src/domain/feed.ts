// Mixes sponsored slots into a product list without crowding it: the first
// ad comes after `firstAt` products and then one every `every` products.
// Pure (no RN) so it runs in the root vitest suite.
export type FeedItem<T> = { kind: 'item'; item: T } | { kind: 'ad'; key: string }

export function withAdSlots<T>(items: T[], { firstAt = 6, every = 12 }: { firstAt?: number; every?: number } = {}): FeedItem<T>[] {
  const feed: FeedItem<T>[] = []
  items.forEach((item, index) => {
    feed.push({ kind: 'item', item })
    const shown = index + 1
    // Never end the list on an ad: only add one when more products follow.
    if (shown < items.length && shown >= firstAt && (shown - firstAt) % every === 0) {
      feed.push({ kind: 'ad', key: `ad-${shown}` })
    }
  })
  return feed
}

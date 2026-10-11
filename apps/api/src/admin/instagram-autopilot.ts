export type Target = 'feed' | 'story'
export type Kind = { type: 'comparison'; savings: number } | { type: 'drop'; pct: number; oldPrice: number }
export interface Candidate { productId: string; name: string; imageUrl: string | null; kind: Kind }

// Feed: the biggest saving between stores (what people share); stories lean on
// price drops for variety. Either falls back to the other kind.
export function pickCandidate(candidates: Candidate[], target: Target, exclude: Set<string>): Candidate | undefined {
  const fresh = candidates.filter(c => !exclude.has(c.productId))
  const preferred = target === 'feed' ? 'comparison' : 'drop'
  return fresh.find(c => c.kind.type === preferred) ?? fresh[0]
}

// Feed format per day of the week (Dominican time, 0 = Sunday): Reels reach
// people who don't follow the account yet, the Sunday "Top 5" carousel gets
// saved, and the plain image keeps the comparison front and centre on the
// other days.
export type FeedFormat = 'image' | 'carousel' | 'reel'
export function feedFormat(weekday: number): FeedFormat {
  if (weekday === 0) return 'carousel'
  return weekday % 2 === 1 ? 'reel' : 'image'
}

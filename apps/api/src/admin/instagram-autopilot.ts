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

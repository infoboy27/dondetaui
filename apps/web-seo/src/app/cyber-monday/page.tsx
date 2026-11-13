import { PriceCheckPage, priceCheckMetadata } from '../../lib/priceCheckPage'

// Live: the verdicts move with every ingestion cycle.
export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return priceCheckMetadata('cyber-monday')
}

export default function CyberMondayPage() {
  return <PriceCheckPage id="cyber-monday" />
}

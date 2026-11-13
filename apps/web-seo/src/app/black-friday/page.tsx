import { PriceCheckPage, priceCheckMetadata } from '../../lib/priceCheckPage'

// Live: the verdicts move with every ingestion cycle.
export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return priceCheckMetadata('black-friday')
}

export default function BlackFridayPage() {
  return <PriceCheckPage id="black-friday" />
}

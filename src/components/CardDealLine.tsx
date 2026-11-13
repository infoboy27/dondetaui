import { cardDealConditions, cardDealParts, type CardDeal } from '../domain/cardPromotions'
import { formatPrice } from '../domain/currency'
import { colors, fonts } from '../design/tokens'

// "💳 Con BHD −10%: RD$22,495 · tope RD$5,000" under a store's price, or for
// cashback "💳 Con BHD, 20% de cashback: te devuelven RD$4,000 después (…)".
export default function CardDealLine({ deal }: { deal: CardDeal }) {
  const conditions = cardDealConditions(deal.promotion)
  const { lead, amount, tail } = cardDealParts(deal)
  return (
    <div
      title={deal.promotion.termsUrl ? 'Sujeto a condiciones del banco' : undefined}
      style={{ fontSize: 11, color: colors.navy400, fontFamily: fonts.body, marginTop: 3, lineHeight: 1.35 }}
    >
      <span aria-hidden="true">💳 </span>
      {lead}{' '}
      <strong style={{ color: colors.accent, fontFamily: fonts.display }}>{formatPrice(amount)}</strong>
      {tail && ` ${tail}`}
      {conditions && <span style={{ color: '#9AAABB' }}> · {conditions}</span>}
    </div>
  )
}

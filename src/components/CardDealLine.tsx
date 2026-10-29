import { cardDealConditions, cardName, type CardDeal } from '../domain/cardPromotions'
import { formatPrice } from '../domain/currency'
import { colors, fonts } from '../design/tokens'

// "💳 Con BHD −10%: RD$22,495 · tope RD$5,000" under a store's price.
export default function CardDealLine({ deal }: { deal: CardDeal }) {
  const conditions = cardDealConditions(deal.promotion)
  return (
    <div
      title={deal.promotion.termsUrl ? 'Sujeto a condiciones del banco' : undefined}
      style={{ fontSize: 11, color: colors.navy400, fontFamily: fonts.body, marginTop: 3, lineHeight: 1.35 }}
    >
      <span aria-hidden="true">💳 </span>
      Con {cardName(deal.promotion)} −{deal.promotion.percent}%:{' '}
      <strong style={{ color: colors.accent, fontFamily: fonts.display }}>{formatPrice(deal.total)}</strong>
      {conditions && <span style={{ color: '#9AAABB' }}> · {conditions}</span>}
    </div>
  )
}

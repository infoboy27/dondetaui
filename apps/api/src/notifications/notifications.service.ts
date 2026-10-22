import { Injectable } from '@nestjs/common'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { PushProvider } from './push.provider'
import { formatPrice } from '../common/currency'
import { priceDropEmail, type PriceDropDetails } from '../auth/account-emails'
import type { NotificationRecipient } from './notifier.types'

@Injectable()
export class NotificationsService {
  constructor(
    private readonly email: EmailProvider,
    private readonly sms: SmsProvider,
    private readonly push: PushProvider,
  ) {}

  async notifyPriceDrop(recipient: NotificationRecipient, productName: string, newPrice: number, previousPrice?: number, product?: { imageUrl: string | null; slug: string | null }): Promise<void> {
    const body = `${productName} ahora cuesta ${formatPrice(newPrice)}. Entra a DóndeTa para ver la oferta.`

    const savings = previousPrice && previousPrice > newPrice ? `Ahorras ${formatPrice(previousPrice - newPrice)} (${Math.round((1 - newPrice / previousPrice) * 100)}%)` : undefined
    const details: PriceDropDetails = {
      previousPrice: previousPrice ? formatPrice(previousPrice) : undefined,
      savings,
      imageUrl: product?.imageUrl,
      path: product?.slug ? `/product/${product.slug}` : null,
    }
    const email = priceDropEmail(productName, formatPrice(newPrice), details)
    await this.email.send(recipient.email, email.subject, email.text, email.html)

    if (recipient.phone) {
      await this.sms.sendWhatsApp(recipient.phone, body)
    }

    if (recipient.pushTokens.length) {
      await this.push.send(recipient.pushTokens, 'DóndeTa', body)
    }
  }
}

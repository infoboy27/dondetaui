import { Injectable } from '@nestjs/common'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { PushProvider } from './push.provider'
import { formatPrice } from '../common/currency'
import { priceDropEmail } from '../auth/account-emails'
import type { NotificationRecipient } from './notifier.types'

@Injectable()
export class NotificationsService {
  constructor(
    private readonly email: EmailProvider,
    private readonly sms: SmsProvider,
    private readonly push: PushProvider,
  ) {}

  async notifyPriceDrop(recipient: NotificationRecipient, productName: string, newPrice: number): Promise<void> {
    const body = `${productName} ahora cuesta ${formatPrice(newPrice)}. Entra a DóndeTa para ver la oferta.`

    const email = priceDropEmail(productName, formatPrice(newPrice))
    await this.email.send(recipient.email, email.subject, email.text, email.html)

    if (recipient.phone) {
      await this.sms.sendWhatsApp(recipient.phone, body)
    }

    if (recipient.pushTokens.length) {
      await this.push.send(recipient.pushTokens, 'DóndeTa', body)
    }
  }
}

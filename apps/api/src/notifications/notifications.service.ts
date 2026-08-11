import { Injectable } from '@nestjs/common'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { PushProvider } from './push.provider'
import type { NotificationRecipient } from './notifier.types'

@Injectable()
export class NotificationsService {
  constructor(
    private readonly email: EmailProvider,
    private readonly sms: SmsProvider,
    private readonly push: PushProvider,
  ) {}

  async notifyPriceDrop(recipient: NotificationRecipient, productName: string, newPrice: number): Promise<void> {
    const subject = `Bajó de precio: ${productName}`
    const body = `${productName} ahora cuesta RD$${newPrice.toLocaleString('es-DO')}. Entra a DóndeTa para ver la oferta.`

    await this.email.send(recipient.email, subject, body)

    if (recipient.phone) {
      await this.sms.sendWhatsApp(recipient.phone, body)
    }

    if (recipient.pushTokens.length) {
      await this.push.send(recipient.pushTokens, 'DóndeTa', body)
    }
  }
}

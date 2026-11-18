import { Injectable, Logger } from '@nestjs/common'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { PushProvider } from './push.provider'
import { buildPriceDropPush, priceDropPct, sendableTokens, type ExpoPushMessage, type TicketOutcome } from './push-messages'
import { formatPrice } from '../common/currency'
import { priceDropEmail, type EmailContent, type PriceDropDetails } from '../auth/account-emails'
import type { PushContent } from './notification-messages'
import type { NotificationRecipient } from './notifier.types'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private readonly email: EmailProvider,
    private readonly sms: SmsProvider,
    private readonly push: PushProvider,
  ) {}

  async notifyPriceDrop(recipient: NotificationRecipient, productName: string, newPrice: number, previousPrice?: number, product?: { imageUrl: string | null; slug: string | null }, lowest90d = false): Promise<void> {
    const body = `${productName} ahora cuesta ${formatPrice(newPrice)}. Entra a DóndeTa para ver la oferta.`

    const savings = previousPrice && previousPrice > newPrice ? `Ahorras ${formatPrice(previousPrice - newPrice)} (${Math.round((1 - newPrice / previousPrice) * 100)}%)` : undefined
    const details: PriceDropDetails = {
      previousPrice: previousPrice ? formatPrice(previousPrice) : undefined,
      savings,
      imageUrl: product?.imageUrl,
      path: product?.slug ? `/product/${product.slug}` : null,
      lowest90d,
    }
    const email = priceDropEmail(productName, formatPrice(newPrice), details)
    // A failed email must not stop the WhatsApp/push copies of the same alert.
    await this.email.send(recipient.email, email.subject, email.text, email.html)
      .catch(error => this.logger.warn(`price-drop email failed: ${String(error)}`))

    if (recipient.phone) {
      await this.sms.sendWhatsApp(recipient.phone, body)
    }

  }

  /**
   * The push copy of a price-drop alert, to every active device of the user.
   * The alerts worker decides whether to call it (env flag, per-run budget)
   * and stores the returned tickets / dead tokens.
   */
  async pushPriceDrop(tokens: string[], productName: string, newPrice: number, previousPrice?: number, slug?: string | null, lowest90d = false): Promise<TicketOutcome> {
    const targets = sendableTokens(tokens)
    if (!targets.length) return { pending: [], disable: [] }
    const content = buildPriceDropPush({
      productName,
      newPrice: formatPrice(newPrice),
      previousPrice: previousPrice && previousPrice > newPrice ? formatPrice(previousPrice) : undefined,
      pct: priceDropPct(previousPrice, newPrice),
      slug: slug ?? null,
      lowest90d,
    })
    const messages: ExpoPushMessage[] = targets.map(to => ({ to, ...content, sound: 'default', channelId: 'price-alerts' }))
    return this.push.send(messages)
  }

  /** One email; throws on a delivery failure so the caller can retry later. */
  async sendEmail(to: string, content: EmailContent): Promise<void> {
    await this.email.send(to, content.subject, content.text, content.html)
  }

  /** Any push copy (watch notifications) to every active device of the user. */
  async pushContent(tokens: string[], content: PushContent, channelId: string): Promise<TicketOutcome> {
    const targets = sendableTokens(tokens)
    if (!targets.length) return { pending: [], disable: [] }
    const messages: ExpoPushMessage[] = targets.map(to => ({ to, ...content, sound: 'default', channelId }))
    return this.push.send(messages)
  }
}

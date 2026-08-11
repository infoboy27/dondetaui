import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name)
  private readonly client: Resend | null
  private readonly from = process.env.RESEND_FROM_EMAIL ?? 'alertas@dondeta.jfmcss.com'

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    this.client = apiKey ? new Resend(apiKey) : null
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`[fallback, no RESEND_API_KEY] to=${to} subject="${subject}" body="${text}"`)
      return
    }

    await this.client.emails.send({ from: this.from, to, subject, text })
  }
}

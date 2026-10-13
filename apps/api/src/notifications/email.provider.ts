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

  async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    if (!this.client) {
      // Without a key nothing is delivered. Subject and body (which may hold
      // one-time codes) are only logged outside production, for local testing.
      const detail = process.env.NODE_ENV === 'production' ? '' : ` subject="${subject}" body="${text}"`
      this.logger.log(`[fallback, no RESEND_API_KEY] to=${to}${detail}`)
      return
    }

    await this.client.emails.send({ from: this.from, to, subject, text, ...(html ? { html } : {}) })
  }
}

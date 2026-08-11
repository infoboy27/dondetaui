import { Injectable, Logger } from '@nestjs/common'
import twilio from 'twilio'

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name)
  private readonly client: ReturnType<typeof twilio> | null
  private readonly fromNumber = process.env.TWILIO_FROM_NUMBER
  private readonly whatsappFrom = process.env.TWILIO_WHATSAPP_FROM

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    this.client = accountSid && authToken ? twilio(accountSid, authToken) : null
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.client || !this.fromNumber) {
      this.logger.log(`[fallback, no TWILIO_*/TWILIO_FROM_NUMBER] sms to=${to} body="${body}"`)
      return
    }

    await this.client.messages.create({ from: this.fromNumber, to, body })
  }

  async sendWhatsApp(to: string, body: string): Promise<void> {
    if (!this.client || !this.whatsappFrom) {
      this.logger.log(`[fallback, no TWILIO_*/TWILIO_WHATSAPP_FROM] whatsapp to=${to} body="${body}"`)
      return
    }

    await this.client.messages.create({
      from: `whatsapp:${this.whatsappFrom}`,
      to: `whatsapp:${to}`,
      body,
    })
  }
}

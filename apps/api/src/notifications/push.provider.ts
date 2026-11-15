import { Injectable, Logger } from '@nestjs/common'
import {
  EXPO_PUSH_RECEIPTS_URL,
  EXPO_PUSH_SEND_URL,
  RECEIPTS_BATCH_SIZE,
  SEND_BATCH_SIZE,
  chunk,
  classifyTickets,
  expoHeaders,
  isExpoPushToken,
  tokensToDisableFromReceipts,
  type ExpoPushMessage,
  type ExpoPushReceipt,
  type ExpoPushTicket,
  type TicketOutcome,
} from './push-messages'

// Expo's push service: plain HTTPS, no SDK. EXPO_ACCESS_TOKEN is optional and
// only needed if "enhanced push security" is turned on in the Expo project.
@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name)
  private readonly accessToken = process.env.EXPO_ACCESS_TOKEN || undefined

  /** Sends in batches of 100. Never throws: failures are logged and the rest goes on. */
  async send(messages: ExpoPushMessage[]): Promise<TicketOutcome> {
    const outcome: TicketOutcome = { pending: [], disable: [] }
    const valid = messages.filter(message => isExpoPushToken(message.to))

    for (const batch of chunk(valid, SEND_BATCH_SIZE)) {
      try {
        const response = await fetch(EXPO_PUSH_SEND_URL, {
          method: 'POST',
          headers: expoHeaders(this.accessToken),
          body: JSON.stringify(batch),
        })
        if (!response.ok) {
          this.logger.warn(`Expo push API responded ${response.status} for ${batch.length} message(s)`)
          continue
        }
        const body = await response.json() as { data?: ExpoPushTicket[] }
        const result = classifyTickets(batch, Array.isArray(body.data) ? body.data : [])
        outcome.pending.push(...result.pending)
        outcome.disable.push(...result.disable)
      } catch (error) {
        this.logger.warn(`Expo push send failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    return outcome
  }

  /** Reads receipts for earlier tickets; returns the tokens Expo says are no longer registered. */
  async deadTokensFromReceipts(tickets: { id: string; token: string }[]): Promise<{ checked: string[]; disable: string[] }> {
    const checked: string[] = []
    const disable: string[] = []
    for (const batch of chunk(tickets, RECEIPTS_BATCH_SIZE)) {
      try {
        const response = await fetch(EXPO_PUSH_RECEIPTS_URL, {
          method: 'POST',
          headers: expoHeaders(this.accessToken),
          body: JSON.stringify({ ids: batch.map(ticket => ticket.id) }),
        })
        if (!response.ok) {
          this.logger.warn(`Expo receipts API responded ${response.status}`)
          continue
        }
        const body = await response.json() as { data?: Record<string, ExpoPushReceipt> }
        const receipts = body.data ?? {}
        disable.push(...tokensToDisableFromReceipts(batch, receipts))
        // A receipt not there yet stays pending (until it ages out).
        checked.push(...batch.filter(ticket => receipts[ticket.id]).map(ticket => ticket.id))
      } catch (error) {
        this.logger.warn(`Expo receipts check failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    return { checked, disable }
  }
}

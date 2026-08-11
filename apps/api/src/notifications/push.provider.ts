import { Injectable, Logger } from '@nestjs/common'

// Expo's push API needs no API key for basic sending (it's free, rate-limited
// per-app) -- https://docs.expo.dev/push-notifications/sending-notifications/#http2-api.
// Chunked to Expo's own 100-tokens-per-request limit.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const CHUNK_SIZE = 100

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name)

  async send(tokens: string[], title: string, body: string): Promise<void> {
    const validTokens = tokens.filter(token => token.startsWith('ExponentPushToken'))
    if (!validTokens.length) return

    for (let i = 0; i < validTokens.length; i += CHUNK_SIZE) {
      const chunk = validTokens.slice(i, i + CHUNK_SIZE)
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(chunk.map(to => ({ to, title, body, sound: 'default' }))),
        })
        if (!response.ok) {
          this.logger.warn(`Expo push API responded ${response.status} for ${chunk.length} token(s)`)
        }
      } catch (error) {
        this.logger.warn(`Expo push send failed: ${error instanceof Error ? error.message : error}`)
      }
    }
  }
}

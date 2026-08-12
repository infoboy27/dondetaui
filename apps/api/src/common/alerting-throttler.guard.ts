import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import type { ThrottlerLimitDetail } from '@nestjs/throttler'
import { sendDiscordAlert } from './discord-webhook'

interface MinimalRequest {
  method: string
  originalUrl: string
  ip: string
}

// Only alerting on /auth/* rejections, not the global 120req/min limit --
// a real-traffic spike tripping the site-wide limit is expected and not
// actionable the same way repeated login/register throttling is (a much
// stronger signal of an actual brute-force/credential-stuffing attempt).
@Injectable()
export class AlertingThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<MinimalRequest>()
    if (request.originalUrl?.startsWith('/api/auth/')) {
      sendDiscordAlert(
        process.env.DISCORD_WEBHOOK_ALERTS,
        `🚨 **Posible ataque de fuerza bruta**\n\`${request.method} ${request.originalUrl}\` desde \`${request.ip}\` superó el límite de intentos.`,
      )
    }
    return super.throwThrottlingException(context, detail)
  }
}

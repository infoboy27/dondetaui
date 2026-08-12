import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { sendDiscordAlert } from './discord-webhook'

interface MinimalRequest {
  method: string
  originalUrl: string
}

interface MinimalResponse {
  status(code: number): { json(body: unknown): void }
}

// Only 5xx is a real "something broke" signal worth paging on -- 4xx
// (validation errors, 401s, 404s) are normal, expected user-facing
// responses and would just be noise here.
@Catch()
export class AlertingExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<MinimalResponse>()
    const request = ctx.getRequest<MinimalRequest>()

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    if (status >= 500) {
      const message = exception instanceof Error ? exception.message : 'Unknown error'
      sendDiscordAlert(
        process.env.DISCORD_WEBHOOK_ALERTS,
        `🔥 **Error ${status}** en \`${request.method} ${request.originalUrl}\`\n${message}`,
      )
    }

    const body = exception instanceof HttpException
      ? exception.getResponse()
      : { statusCode: status, message: 'Internal server error' }

    response.status(status).json(body)
  }
}

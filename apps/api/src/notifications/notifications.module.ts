import { Module } from '@nestjs/common'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { PushProvider } from './push.provider'
import { NotificationsService } from './notifications.service'
import { PushTokensController } from './push-tokens.controller'
import { PushTokensRepository } from './push-tokens.repository'

@Module({
  controllers: [PushTokensController],
  providers: [EmailProvider, SmsProvider, PushProvider, NotificationsService, PushTokensRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}

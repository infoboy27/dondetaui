import { Module } from '@nestjs/common'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { NotificationsService } from './notifications.service'

@Module({
  providers: [EmailProvider, SmsProvider, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

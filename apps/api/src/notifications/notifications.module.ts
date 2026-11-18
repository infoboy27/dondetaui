import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { PushProvider } from './push.provider'
import { NotificationsService } from './notifications.service'
import { PushTokensController } from './push-tokens.controller'
import { PushTokensRepository } from './push-tokens.repository'
import { NotificationPrefsController } from './notification-prefs.controller'
import { NotificationPrefsRepository } from './notification-prefs.repository'

@Module({
  imports: [AuthModule],
  controllers: [PushTokensController, NotificationPrefsController],
  providers: [EmailProvider, SmsProvider, PushProvider, NotificationsService, PushTokensRepository, NotificationPrefsRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}

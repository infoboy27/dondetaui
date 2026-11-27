import { Module } from '@nestjs/common'
import { AdminGuard, AdminIdentityGuard } from '../admin/admin.guard'
import { AuthModule } from '../auth/auth.module'
import { EmailProvider } from './email.provider'
import { SmsProvider } from './sms.provider'
import { PushProvider } from './push.provider'
import { NotificationsService } from './notifications.service'
import { PushBroadcastController } from './push-broadcast.controller'
import { PushTokensController } from './push-tokens.controller'
import { PushTokensRepository } from './push-tokens.repository'

@Module({
  imports: [AuthModule],
  controllers: [PushTokensController, PushBroadcastController],
  providers: [EmailProvider, SmsProvider, PushProvider, NotificationsService, PushTokensRepository, AdminGuard, AdminIdentityGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}

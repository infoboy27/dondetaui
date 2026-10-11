import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AdminController } from './admin.controller'
import { AdminGuard, AdminIdentityGuard } from './admin.guard'
import { AdminMfaController } from './admin-mfa.controller'
import { AdminRepository } from './admin.repository'
import { InstagramAdminController, InstagramMediaController } from './instagram.controller'
import { InstagramService } from './instagram.service'

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminMfaController, InstagramAdminController, InstagramMediaController],
  providers: [AdminRepository, AdminGuard, AdminIdentityGuard, InstagramService],
})
export class AdminModule {}

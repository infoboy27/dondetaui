import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AdminController } from './admin.controller'
import { AdminGuard } from './admin.guard'
import { AdminRepository } from './admin.repository'

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminRepository, AdminGuard],
})
export class AdminModule {}

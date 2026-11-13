import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { DigestsController, DigestUnsubscribeController } from './digests.controller'
import { DigestsRepository } from './digests.repository'

@Module({
  imports: [AuthModule],
  controllers: [DigestsController, DigestUnsubscribeController],
  providers: [DigestsRepository],
})
export class DigestsModule {}

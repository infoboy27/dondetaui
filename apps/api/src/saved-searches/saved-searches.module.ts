import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SavedSearchesController } from './saved-searches.controller'
import { SavedSearchesRepository } from './saved-searches.repository'

@Module({
  imports: [AuthModule],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesRepository],
})
export class SavedSearchesModule {}

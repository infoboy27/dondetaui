import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SearchHistoryController } from './search-history.controller'
import { SearchHistoryRepository } from './search-history.repository'
import { SearchHistoryService } from './search-history.service'

@Module({
  imports: [AuthModule],
  controllers: [SearchHistoryController],
  providers: [SearchHistoryRepository, SearchHistoryService],
})
export class SearchHistoryModule {}

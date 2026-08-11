import { Injectable } from '@nestjs/common'
import { SearchHistoryRepository } from './search-history.repository'

@Injectable()
export class SearchHistoryService {
  constructor(private readonly history: SearchHistoryRepository) {}

  list(userId: string): Promise<string[]> {
    return this.history.recentDistinct(userId)
  }

  record(userId: string, query: string): Promise<void> {
    return this.history.record(userId, query.trim())
  }

  clear(userId: string): Promise<void> {
    return this.history.clear(userId)
  }
}

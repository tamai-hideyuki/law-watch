import { WatchListRepository } from '../ports/watch-list-repository'
import { createLogger } from '../../infrastructure/logging/logger'

export class DeleteWatchListUseCase {
  private readonly logger = createLogger('DeleteWatchListUseCase')

  constructor(
    private readonly watchListRepository: WatchListRepository
  ) {}

  async execute(watchListId: string, userId: string): Promise<void> {
    // 1. 監視リストの存在確認
    const watchList = await this.watchListRepository.findById(watchListId)
    if (!watchList) {
      throw new Error('Watch list not found')
    }

    // 2. ユーザー所有権確認
    if (watchList.userId !== userId) {
      throw new Error('Unauthorized: Watch list does not belong to user')
    }

    // 3. 監視リスト削除
    await this.watchListRepository.delete(watchListId)

    this.logger.info('Watch list deleted successfully', { 
      watchListId, 
      userId,
      watchListName: watchList.name 
    })
  }
}
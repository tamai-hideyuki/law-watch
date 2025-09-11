import { WatchListRepository } from '../ports/watch-list-repository'
import { createLogger } from '../../infrastructure/logging/logger'
import { validateWatchListName } from '../../domain/monitoring/validation/watch-list-validation'
import { Result, ok, err } from '../../domain/common/result'

export class UpdateWatchListUseCase {
  private readonly logger = createLogger('UpdateWatchListUseCase')

  constructor(
    private readonly watchListRepository: WatchListRepository
  ) {}

  async execute(watchListId: string, userId: string, newName: string): Promise<Result<void, string>> {
    // 1. 名前のバリデーション
    const nameValidation = validateWatchListName(newName)
    if (!nameValidation.isValid) {
      return err(nameValidation.error)
    }

    try {
      // 2. 監視リストの存在確認
      const watchList = await this.watchListRepository.findById(watchListId)
      if (!watchList) {
        return err('Watch list not found')
      }

      // 3. ユーザー所有権確認
      if (watchList.userId !== userId) {
        return err('Unauthorized: Watch list does not belong to user')
      }

      // 4. 名前を更新
      const updatedWatchList = {
        ...watchList,
        name: newName.trim(),
        updatedAt: new Date()
      }

      await this.watchListRepository.save(updatedWatchList)

      this.logger.info('Watch list name updated successfully', { 
        watchListId, 
        userId,
        oldName: watchList.name,
        newName: newName.trim()
      })

      return ok(undefined)
    } catch (error) {
      this.logger.error('Failed to update watch list name', { 
        watchListId, 
        userId, 
        newName,
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return err('Failed to update watch list name')
    }
  }
}
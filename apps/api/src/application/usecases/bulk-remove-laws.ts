import { LawId } from '../../domain/law'
import { WatchList, removeLawFromWatchList } from '../../domain/monitoring/entities/watch-list'
import { WatchListRepository } from '../ports/watch-list-repository'
import { createLogger } from '../../infrastructure/logging/logger'

export class BulkRemoveLawsUseCase {
  private readonly logger = createLogger('BulkRemoveLawsUseCase')

  constructor(
    private readonly watchListRepository: WatchListRepository
  ) {}

  async execute(watchListId: string, lawIds: LawId[]): Promise<WatchList> {
    // 1. 監視リストの存在確認
    const watchList = await this.watchListRepository.findById(watchListId)
    if (!watchList) {
      throw new Error('Watch list not found')
    }

    // 2. 複数の法令を順次削除
    let updatedWatchList = watchList
    const removedLaws: string[] = []
    const failedLaws: string[] = []

    for (const lawId of lawIds) {
      try {
        if (updatedWatchList.lawIds.includes(lawId)) {
          updatedWatchList = removeLawFromWatchList(updatedWatchList, lawId)
          removedLaws.push(lawId)
        } else {
          failedLaws.push(lawId)
          this.logger.warn('Law not found in watch list', { 
            watchListId, 
            lawId 
          })
        }
      } catch (error) {
        failedLaws.push(lawId)
        this.logger.error('Failed to remove law from watch list', { 
          watchListId, 
          lawId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // 3. 更新された監視リストを保存
    if (removedLaws.length > 0) {
      await this.watchListRepository.save(updatedWatchList)
    }

    this.logger.info('Bulk law removal completed', { 
      watchListId,
      removedCount: removedLaws.length,
      failedCount: failedLaws.length,
      removedLaws,
      failedLaws
    })

    return updatedWatchList
  }
}
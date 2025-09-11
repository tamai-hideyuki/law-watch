import { LawId, createLawId, createLawCategory, createLawStatus } from '../../domain/law'
import { WatchList, addLawToWatchList } from '../../domain/monitoring/entities/watch-list'
import { WatchListRepository } from '../ports/watch-list-repository'
import { LawRepository } from '../ports/law-repository'
import { EGovApi } from '../ports/e-gov-api'
import { createLogger } from '../../infrastructure/logging/logger'

export class AddLawToMonitoringUseCase {
  private readonly logger = createLogger('AddLawToMonitoringUseCase')

  constructor(
    private readonly watchListRepository: WatchListRepository,
    private readonly lawRepository: LawRepository,
    private readonly eGovClient: EGovApi
  ) {}

  async execute(watchListId: string, lawId: LawId): Promise<WatchList> {
    // 1. 監視リストの存在確認
    const watchList = await this.watchListRepository.findById(watchListId)
    if (!watchList) {
      throw new Error('Watch list not found')
    }

    // 2. 既に監視対象に含まれているかチェック
    if (watchList.lawIds.includes(lawId.value)) {
      this.logger.info('Law already in watch list', { watchListId, lawId: lawId.value })
      return watchList
    }

    // 3. 法令データがLawテーブルに存在するかチェック
    let existingLaw = await this.lawRepository.findById(lawId)
    
    if (!existingLaw) {
      // 4. 法令データが存在しない場合、e-Gov APIから取得
      this.logger.info('Fetching law data from e-Gov API', { lawId: lawId.value })
      const lawData = await this.eGovClient.getLawDetail(lawId)
      
      if (!lawData) {
        throw new Error(`Law not found in e-Gov API: ${lawId.value}`)
      }

      // 5. 法令データをLawテーブルに保存
      existingLaw = await this.lawRepository.save({
        id: createLawId(lawData.id),
        name: lawData.name,
        number: lawData.number,
        category: createLawCategory(lawData.category),
        status: createLawStatus(lawData.status),
        promulgationDate: new Date(lawData.promulgationDate)
      })
      
      this.logger.info('Law data saved to database', { lawId: lawId.value, name: lawData.name })
    }

    // 6. 監視リストに法令を追加
    const updatedWatchList = addLawToWatchList(watchList, lawId)
    await this.watchListRepository.save(updatedWatchList)
    
    this.logger.info('Law added to watch list', { 
      watchListId, 
      lawId: lawId.value, 
      watchListName: updatedWatchList.name 
    })
    
    return updatedWatchList
  }
}
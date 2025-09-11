import { LawId, createLawId, createLawCategory, createLawStatus } from '../../domain/law'
import { WatchList, addLawToWatchList } from '../../domain/monitoring/entities/watch-list'
import { WatchListRepository } from '../ports/watch-list-repository'
import { LawRepository } from '../ports/law-repository'
import { EGovApi } from '../ports/e-gov-api'
import { SnapshotRepository } from '../../infrastructure/database/prisma-snapshot-repository'
import { HashService } from '../../domain/monitoring/services/hash-service'
import { createLawSnapshot } from '../../domain/monitoring/entities/law-snapshot'
import { createLogger } from '../../infrastructure/logging/logger'

export class AddLawToMonitoringUseCase {
  private readonly logger = createLogger('AddLawToMonitoringUseCase')
  private readonly hashService = new HashService()

  constructor(
    private readonly watchListRepository: WatchListRepository,
    private readonly lawRepository: LawRepository,
    private readonly eGovClient: EGovApi,
    private readonly snapshotRepository?: SnapshotRepository
  ) {}

  async execute(watchListId: string, lawId: LawId): Promise<WatchList> {
    // 1. 監視リストの存在確認
    const watchList = await this.watchListRepository.findById(watchListId)
    if (!watchList) {
      throw new Error('Watch list not found')
    }

    // 2. 既に監視対象に含まれているかチェック
    if (watchList.lawIds.includes(lawId)) {
      this.logger.info('Law already in watch list', { watchListId, lawId })
      return watchList
    }

    // 3. 法令データがLawテーブルに存在するかチェック
    let existingLaw = await this.lawRepository.findById(lawId)
    
    if (!existingLaw) {
      // 4. 法令データが存在しない場合、e-Gov APIから取得
      this.logger.info('Fetching law data from e-Gov API', { lawId })
      const lawData = await this.eGovClient.getLawDetail(lawId)
      
      if (!lawData) {
        throw new Error(`Law not found in e-Gov API: ${lawId}`)
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
      
      this.logger.info('Law data saved to database', { lawId, name: lawData.name })

      // 6. 法令の初回スナップショット作成
      if (this.snapshotRepository) {
        await this.createInitialSnapshot(lawData)
      }
    }

    // 6. 監視リストに法令を追加
    const updatedWatchList = addLawToWatchList(watchList, lawId)
    await this.watchListRepository.save(updatedWatchList)
    
    this.logger.info('Law added to watch list', { 
      watchListId, 
      lawId, 
      watchListName: updatedWatchList.name 
    })
    
    return updatedWatchList
  }

  private async createInitialSnapshot(lawData: any): Promise<void> {
    try {
      // 法令内容のハッシュ生成
      const contentHash = this.hashService.generateContentHash(lawData)
      
      // 初回スナップショット作成
      const snapshot = createLawSnapshot({
        lawId: lawData.id,
        contentHash,
        metadata: {
          name: lawData.name,
          number: lawData.number,
          category: lawData.category,
          status: lawData.status,
          promulgationDate: lawData.promulgationDate
        },
        version: '1.0.0'
      })
      
      await this.snapshotRepository!.save(snapshot)
      
      this.logger.info('Initial snapshot created', {
        lawId: lawData.id,
        hashPrefix: contentHash.substring(0, 8)
      })
    } catch (error) {
      this.logger.error('Failed to create initial snapshot', {
        lawId: lawData.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // スナップショット作成失敗は法令追加をブロックしない
    }
  }
}
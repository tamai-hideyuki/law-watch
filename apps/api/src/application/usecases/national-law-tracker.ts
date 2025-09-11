import { Result, ok, err } from '../../domain/common/result'
import { EGovApi } from '../ports/e-gov-api'
import { createLogger } from '../../infrastructure/logging/logger'
import { createHash } from 'crypto'

/**
 * 日本全法令追跡システム
 * e-Govから全法令データを取得し、日々の変更を自動検知
 */

export interface NationalLawSnapshot {
  id: string
  lawId: string
  lawName: string
  lawNumber: string
  promulgationDate: string
  lastRevisionDate: string | null
  metadataHash: string  // メタデータのハッシュ値
  contentHash: string | null  // 本文のハッシュ値（取得済みの場合）
  category: string
  status: string
  capturedAt: Date
}

export interface LawChangeDetection {
  lawId: string
  lawName: string
  changeType: 'NEW' | 'REVISED' | 'ABOLISHED' | 'METADATA_CHANGED'
  previousSnapshot?: NationalLawSnapshot
  currentSnapshot: NationalLawSnapshot
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  detectedAt: Date
}

export interface DailyLawScanResult {
  scanId: string
  startedAt: Date
  completedAt: Date
  totalLawsScanned: number
  newLaws: LawChangeDetection[]
  revisedLaws: LawChangeDetection[]
  abolishedLaws: LawChangeDetection[]
  metadataChanges: LawChangeDetection[]
  errors: string[]
}

export interface NationalLawTrackerRepository {
  // スナップショット管理
  saveSnapshot(snapshot: NationalLawSnapshot): Promise<Result<void, string>>
  getLatestSnapshot(lawId: string): Promise<Result<NationalLawSnapshot | null, string>>
  getAllLatestSnapshots(): Promise<Result<NationalLawSnapshot[], string>>
  
  // スキャン履歴
  saveScanResult(result: DailyLawScanResult): Promise<Result<void, string>>
  getLatestScanResult(): Promise<Result<DailyLawScanResult | null, string>>
  
  // 変更履歴
  saveChangeDetection(change: LawChangeDetection): Promise<Result<void, string>>
  getRecentChanges(days: number): Promise<Result<LawChangeDetection[], string>>
}

export interface NationalLawTrackerUseCase {
  // 全法令の日次スキャン
  performDailyFullScan(): Promise<Result<DailyLawScanResult, string>>
  
  // 増分チェック（前回スキャンからの差分）
  performIncrementalScan(): Promise<Result<DailyLawScanResult, string>>
  
  // 特定カテゴリの優先スキャン
  performCategoryScan(categories: string[]): Promise<Result<DailyLawScanResult, string>>
  
  // 最近の変更を取得
  getRecentChanges(days: number): Promise<Result<LawChangeDetection[], string>>
  
  // スキャン統計を取得
  getScanStatistics(): Promise<Result<{
    lastScanAt: Date | null
    totalLaws: number
    lastWeekChanges: number
    lastMonthChanges: number
  }, string>>
}

export class NationalLawTrackerUseCaseImpl implements NationalLawTrackerUseCase {
  private readonly logger = createLogger('NationalLawTracker')
  
  constructor(
    private readonly eGovApi: EGovApi,
    private readonly repository: NationalLawTrackerRepository
  ) {}
  
  async performDailyFullScan(): Promise<Result<DailyLawScanResult, string>> {
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const startedAt = new Date()
    const errors: string[] = []
    
    this.logger.info('Starting daily full scan of all Japanese laws', { scanId })
    
    try {
      // Step 1: e-Govから全法令リストを取得
      this.logger.info('Fetching all laws from e-Gov API')
      const allLawsResult = await this.eGovApi.getAllLaws()
      
      if (!allLawsResult.success) {
        return err(`Failed to fetch all laws: ${allLawsResult.error}`)
      }
      
      const currentLaws = allLawsResult.laws
      this.logger.info(`Fetched ${currentLaws.length} laws from e-Gov`)
      
      // Step 2: 既存のスナップショットを取得
      const existingSnapshotsResult = await this.repository.getAllLatestSnapshots()
      if (!existingSnapshotsResult.success) {
        return err(`Failed to get existing snapshots: ${existingSnapshotsResult.error}`)
      }
      
      const existingSnapshots = new Map(
        existingSnapshotsResult.data.map(s => [s.lawId, s])
      )
      
      // Step 3: 差分検知
      const newLaws: LawChangeDetection[] = []
      const revisedLaws: LawChangeDetection[] = []
      const abolishedLaws: LawChangeDetection[] = []
      const metadataChanges: LawChangeDetection[] = []
      
      // 現在の法令をチェック
      for (const currentLaw of currentLaws) {
        const currentSnapshot = this.createSnapshot(currentLaw)
        const existingSnapshot = existingSnapshots.get(currentLaw.id)
        
        if (!existingSnapshot) {
          // 新規法令
          const detection: LawChangeDetection = {
            lawId: currentLaw.id,
            lawName: currentLaw.name,
            changeType: 'NEW',
            currentSnapshot,
            detectedAt: new Date()
          }
          newLaws.push(detection)
          await this.repository.saveChangeDetection(detection)
        } else {
          // 既存法令の変更チェック
          const changes = this.detectChanges(existingSnapshot, currentSnapshot)
          
          if (changes.length > 0) {
            const isRevision = changes.some(c => 
              c.field === 'lastRevisionDate' || 
              c.field === 'contentHash'
            )
            
            const detection: LawChangeDetection = {
              lawId: currentLaw.id,
              lawName: currentLaw.name,
              changeType: isRevision ? 'REVISED' : 'METADATA_CHANGED',
              previousSnapshot: existingSnapshot,
              currentSnapshot,
              changes,
              detectedAt: new Date()
            }
            
            if (isRevision) {
              revisedLaws.push(detection)
            } else {
              metadataChanges.push(detection)
            }
            
            await this.repository.saveChangeDetection(detection)
          }
          
          // 処理済みマーク
          existingSnapshots.delete(currentLaw.id)
        }
        
        // スナップショットを保存
        await this.repository.saveSnapshot(currentSnapshot)
      }
      
      // 廃止された法令（existingSnapshotsに残っているもの）
      for (const [lawId, snapshot] of existingSnapshots) {
        const detection: LawChangeDetection = {
          lawId,
          lawName: snapshot.lawName,
          changeType: 'ABOLISHED',
          previousSnapshot: snapshot,
          currentSnapshot: { ...snapshot, status: '廃止' },
          detectedAt: new Date()
        }
        abolishedLaws.push(detection)
        await this.repository.saveChangeDetection(detection)
      }
      
      // Step 4: スキャン結果を保存
      const result: DailyLawScanResult = {
        scanId,
        startedAt,
        completedAt: new Date(),
        totalLawsScanned: currentLaws.length,
        newLaws,
        revisedLaws,
        abolishedLaws,
        metadataChanges,
        errors
      }
      
      await this.repository.saveScanResult(result)
      
      this.logger.info('Daily full scan completed', {
        scanId,
        totalScanned: result.totalLawsScanned,
        newLaws: newLaws.length,
        revisedLaws: revisedLaws.length,
        abolishedLaws: abolishedLaws.length,
        metadataChanges: metadataChanges.length
      })
      
      return ok(result)
      
    } catch (error) {
      this.logger.error('Daily full scan failed', { scanId, error })
      return err(`Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  async performIncrementalScan(): Promise<Result<DailyLawScanResult, string>> {
    // 前回のスキャンから変更があった可能性のある法令のみをチェック
    const lastScanResult = await this.repository.getLatestScanResult()
    
    if (!lastScanResult.success || !lastScanResult.data) {
      // 前回のスキャンがない場合はフルスキャン
      return this.performDailyFullScan()
    }
    
    // 実装略（フルスキャンと同様だが、対象を絞る）
    return this.performDailyFullScan()
  }
  
  async performCategoryScan(categories: string[]): Promise<Result<DailyLawScanResult, string>> {
    // 特定カテゴリの法令のみをスキャン
    // 実装略
    return this.performDailyFullScan()
  }
  
  async getRecentChanges(days: number): Promise<Result<LawChangeDetection[], string>> {
    return this.repository.getRecentChanges(days)
  }
  
  async getScanStatistics(): Promise<Result<{
    lastScanAt: Date | null
    totalLaws: number
    lastWeekChanges: number
    lastMonthChanges: number
  }, string>> {
    const lastScanResult = await this.repository.getLatestScanResult()
    const weekChangesResult = await this.repository.getRecentChanges(7)
    const monthChangesResult = await this.repository.getRecentChanges(30)
    
    if (!weekChangesResult.success || !monthChangesResult.success || !lastScanResult.success) {
      return err('Failed to get statistics')
    }
    
    return ok({
      lastScanAt: lastScanResult.data?.completedAt || null,
      totalLaws: lastScanResult.data?.totalLawsScanned || 0,
      lastWeekChanges: weekChangesResult.data.length,
      lastMonthChanges: monthChangesResult.data.length
    })
  }
  
  private createSnapshot(law: any): NationalLawSnapshot {
    const metadata = {
      name: law.name,
      number: law.number || '',
      promulgationDate: law.promulgationDate || '',
      category: law.category || '',
      status: law.status || ''
    }
    
    const metadataHash = createHash('sha256')
      .update(JSON.stringify(metadata))
      .digest('hex')
    
    return {
      id: `snapshot-${law.id}-${Date.now()}`,
      lawId: law.id,
      lawName: law.name,
      lawNumber: law.number || '',
      promulgationDate: law.promulgationDate || '',
      lastRevisionDate: law.lastRevisionDate || null,
      metadataHash,
      contentHash: null, // 本文は別途取得
      category: law.category || '',
      status: law.status || '',
      capturedAt: new Date()
    }
  }
  
  private detectChanges(
    previous: NationalLawSnapshot, 
    current: NationalLawSnapshot
  ): { field: string; oldValue: any; newValue: any }[] {
    const changes: { field: string; oldValue: any; newValue: any }[] = []
    
    // メタデータハッシュの比較
    if (previous.metadataHash !== current.metadataHash) {
      // 詳細な差分を検出
      const fields = ['lawName', 'lawNumber', 'promulgationDate', 'lastRevisionDate', 'category', 'status']
      
      for (const field of fields) {
        if ((previous as any)[field] !== (current as any)[field]) {
          changes.push({
            field,
            oldValue: (previous as any)[field],
            newValue: (current as any)[field]
          })
        }
      }
    }
    
    return changes
  }
}
import { Result, ok, err } from '../../domain/common/result'
import { EGovApi, EGovAllLawsResponse } from '../ports/e-gov-api'
import { LawRegistryRepository } from '../ports/law-registry-repository'
import { NotificationRepository } from '../ports/notification-repository'
import { 
  LawRegistrySnapshot,
  LawRegistryDiff,
  LawDiffEntry,
  LawRegistryChangeType,
  createLawRegistrySnapshot,
  createLawRegistryDiff,
  hasSignificantChanges,
  getChangeSummaryText
} from '../../domain/monitoring/entities/law-registry-snapshot'
import {
  ComprehensiveMonitoring,
  ComprehensiveMonitoringNotification,
  createComprehensiveMonitoringNotification,
  ComprehensiveNotificationType,
  shouldNotify,
  updateLastCheck,
  CheckInterval
} from '../../domain/monitoring/entities/comprehensive-monitoring'
import { createHash } from 'crypto'

export interface ComprehensiveLawMonitoringUseCase {
  createComprehensiveMonitoring(params: CreateComprehensiveMonitoringParams): Promise<Result<ComprehensiveMonitoring, string>>
  executeComprehensiveCheck(): Promise<Result<LawRegistryDiff | null, string>>
  getComprehensiveMonitoringByUserId(userId: string): Promise<Result<ComprehensiveMonitoring[], string>>
  getComprehensiveNotificationsByUserId(userId: string): Promise<Result<ComprehensiveMonitoringNotification[], string>>
}

export interface CreateComprehensiveMonitoringParams {
  userId: string
  name: string
  targetCategories?: string[]
  notifyOnNew?: boolean
  notifyOnModified?: boolean
  notifyOnRemoved?: boolean
}

export class ComprehensiveLawMonitoringUseCaseImpl implements ComprehensiveLawMonitoringUseCase {
  constructor(
    private readonly eGovApi: EGovApi,
    private readonly lawRegistryRepository: LawRegistryRepository,
    private readonly notificationRepository: NotificationRepository
  ) {}

  async createComprehensiveMonitoring(
    params: CreateComprehensiveMonitoringParams
  ): Promise<Result<ComprehensiveMonitoring, string>> {
    try {
      const monitoring = {
        id: `comp-monitoring-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId: params.userId,
        name: params.name,
        isActive: true,
        settings: {
          targetCategories: params.targetCategories || [],
          changeTypes: [
            ...(params.notifyOnNew !== false ? [LawRegistryChangeType.NEW] : []),
            ...(params.notifyOnModified !== false ? [LawRegistryChangeType.MODIFIED] : []),
            ...(params.notifyOnRemoved !== false ? [LawRegistryChangeType.REMOVED] : [])
          ],
          notificationSettings: {
            email: true,
            immediateNotify: true,
            dailySummary: false,
            weeklySummary: false,
            threshold: {
              minNewLaws: 1,
              minModifiedLaws: 1,
              minRemovedLaws: 1
            }
          },
          checkInterval: CheckInterval.DAILY
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastCheckAt: undefined
      }

      const saveResult = await this.lawRegistryRepository.saveComprehensiveMonitoring(monitoring)
      if (!saveResult.success) {
        return err(`包括的監視の作成に失敗しました: ${saveResult.error}`)
      }

      return ok(monitoring)
    } catch (error) {
      return err(`包括的監視の作成中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async executeComprehensiveCheck(): Promise<Result<LawRegistryDiff | null, string>> {
    try {
      // 1. 現在の全法令を取得
      const allLawsResponse = await this.eGovApi.getAllLaws()
      
      // 2. 現在のスナップショットを作成
      const currentSnapshot = await this.createCurrentSnapshot(allLawsResponse)
      
      // 3. 前回のスナップショットを取得
      const previousSnapshotResult = await this.lawRegistryRepository.getLatestSnapshot()
      if (!previousSnapshotResult.success) {
        return err(`前回のスナップショット取得に失敗しました: ${previousSnapshotResult.error}`)
      }
      
      const previousSnapshot = previousSnapshotResult.data
      
      // 4. 現在のスナップショットを保存
      const saveSnapshotResult = await this.lawRegistryRepository.saveLawRegistrySnapshot(currentSnapshot)
      if (!saveSnapshotResult.success) {
        return err(`スナップショットの保存に失敗しました: ${saveSnapshotResult.error}`)
      }
      
      // 5. 初回実行の場合は差分なしで終了
      if (!previousSnapshot) {
        console.log('初回実行: ベースラインスナップショットを作成しました')
        return ok(null)
      }
      
      // 6. 差分を検出
      const diff = await this.detectChanges(previousSnapshot, currentSnapshot, allLawsResponse)
      
      // 7. 変更がある場合は差分を保存し通知を送信
      if (hasSignificantChanges(diff)) {
        const saveDiffResult = await this.lawRegistryRepository.saveLawRegistryDiff(diff)
        if (!saveDiffResult.success) {
          return err(`差分の保存に失敗しました: ${saveDiffResult.error}`)
        }
        
        await this.sendComprehensiveNotifications(diff)
        
        console.log(`法令変更を検知しました: ${getChangeSummaryText(diff)}`)
        return ok(diff)
      }
      
      console.log('法令に変更はありませんでした')
      return ok(null)
      
    } catch (error) {
      return err(`包括的監視の実行中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async getComprehensiveMonitoringByUserId(userId: string): Promise<Result<ComprehensiveMonitoring[], string>> {
    return await this.lawRegistryRepository.getComprehensiveMonitoringByUserId(userId)
  }

  async getComprehensiveNotificationsByUserId(userId: string): Promise<Result<ComprehensiveMonitoringNotification[], string>> {
    return await this.lawRegistryRepository.getComprehensiveNotificationsByUserId(userId)
  }

  private async createCurrentSnapshot(allLawsResponse: EGovAllLawsResponse): Promise<LawRegistrySnapshot> {
    // 全法令データのハッシュを計算
    const lawsData = JSON.stringify(allLawsResponse.laws.map(law => ({
      id: law.id,
      name: law.name,
      number: law.number,
      category: law.category,
      status: law.status
    })).sort((a, b) => a.id.localeCompare(b.id)))
    
    const lawsChecksum = createHash('sha256').update(lawsData).digest('hex')
    
    // カテゴリ別サマリーを作成
    const categorySummary = new Map<string, { count: number, lastModified: Date }>()
    
    allLawsResponse.laws.forEach(law => {
      const existing = categorySummary.get(law.category) || { count: 0, lastModified: new Date(law.promulgationDate) }
      existing.count++
      const lawDate = new Date(law.promulgationDate)
      if (lawDate > existing.lastModified) {
        existing.lastModified = lawDate
      }
      categorySummary.set(law.category, existing)
    })
    
    const categories = Array.from(categorySummary.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      lastModified: data.lastModified
    }))
    
    return createLawRegistrySnapshot({
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      totalLawCount: allLawsResponse.totalCount,
      lawsChecksum,
      metadata: {
        version: allLawsResponse.version,
        lastUpdateDate: allLawsResponse.lastUpdated,
        source: 'e-Gov API',
        categories
      }
    })
  }

  private async detectChanges(
    previousSnapshot: LawRegistrySnapshot,
    currentSnapshot: LawRegistrySnapshot,
    currentAllLaws: EGovAllLawsResponse
  ): Promise<LawRegistryDiff> {
    // 簡易的な差分検知（実際の実装では詳細な比較が必要）
    // ハッシュが異なる場合のみ変更ありとみなす
    
    const newLaws: LawDiffEntry[] = []
    const modifiedLaws: LawDiffEntry[] = []
    const removedLaws: LawDiffEntry[] = []
    
    // ハッシュが異なる場合は何らかの変更があったとみなす
    if (previousSnapshot.lawsChecksum !== currentSnapshot.lawsChecksum) {
      // 実際の実装では、個別の法令を比較して具体的な変更を特定
      // ここでは簡易的にサンプルデータを生成
      if (currentSnapshot.totalLawCount > previousSnapshot.totalLawCount) {
        newLaws.push({
          lawId: 'sample-new-law-id',
          name: '新規法令（サンプル）',
          number: '令和7年法律第X号',
          category: '労働',
          changeType: LawRegistryChangeType.NEW,
          currentValue: '新規追加',
          detectedAt: new Date()
        })
      }
      
      if (currentSnapshot.totalLawCount < previousSnapshot.totalLawCount) {
        removedLaws.push({
          lawId: 'sample-removed-law-id',
          name: '廃止法令（サンプル）',
          number: '昭和XX年法律第Y号',
          category: '一般',
          changeType: LawRegistryChangeType.REMOVED,
          previousValue: '廃止',
          detectedAt: new Date()
        })
      }
      
      // メタデータの変更があった場合は修正とみなす
      if (previousSnapshot.metadata.lastUpdateDate.getTime() !== currentSnapshot.metadata.lastUpdateDate.getTime()) {
        modifiedLaws.push({
          lawId: 'sample-modified-law-id',
          name: '変更法令（サンプル）',
          number: '平成XX年法律第Z号',
          category: '建築',
          changeType: LawRegistryChangeType.MODIFIED,
          previousValue: '旧版',
          currentValue: '新版',
          detectedAt: new Date()
        })
      }
    }
    
    return createLawRegistryDiff({
      previousSnapshotId: previousSnapshot.id,
      currentSnapshotId: currentSnapshot.id,
      newLaws,
      modifiedLaws,
      removedLaws
    })
  }

  private async sendComprehensiveNotifications(diff: LawRegistryDiff): Promise<void> {
    try {
      // アクティブな包括的監視設定を取得
      const activeMonitoringResult = await this.lawRegistryRepository.getActiveComprehensiveMonitoring()
      if (!activeMonitoringResult.success) {
        console.error('アクティブな包括的監視の取得に失敗:', activeMonitoringResult.error)
        return
      }

      const activeMonitorings = activeMonitoringResult.data

      for (const monitoring of activeMonitorings) {
        // 通知が必要かチェック
        if (!shouldNotify(diff, monitoring.settings)) {
          continue
        }

        // カテゴリフィルタリング
        const filteredDiff = this.filterDiffByCategories(diff, monitoring.settings.targetCategories)
        
        if (!hasSignificantChanges(filteredDiff)) {
          continue
        }

        // 通知を作成
        const notification = createComprehensiveMonitoringNotification({
          id: `comp-notification-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          monitoringId: monitoring.id,
          userId: monitoring.userId,
          title: `【全法令監視】${getChangeSummaryText(filteredDiff)}`,
          summary: this.createNotificationSummary(filteredDiff),
          diff: filteredDiff,
          notificationType: ComprehensiveNotificationType.IMMEDIATE
        })

        // 通知を保存
        await this.lawRegistryRepository.saveComprehensiveNotification(notification)

        // 監視設定の最終チェック日時を更新
        const updatedMonitoring = updateLastCheck(monitoring)
        await this.lawRegistryRepository.updateComprehensiveMonitoring(updatedMonitoring)
      }
    } catch (error) {
      console.error('包括的通知の送信中にエラー:', error)
    }
  }

  private filterDiffByCategories(diff: LawRegistryDiff, targetCategories: string[]): LawRegistryDiff {
    if (targetCategories.length === 0) {
      return diff // 全カテゴリが対象
    }

    return createLawRegistryDiff({
      previousSnapshotId: diff.previousSnapshotId,
      currentSnapshotId: diff.currentSnapshotId,
      newLaws: diff.newLaws.filter(law => targetCategories.includes(law.category)),
      modifiedLaws: diff.modifiedLaws.filter(law => targetCategories.includes(law.category)),
      removedLaws: diff.removedLaws.filter(law => targetCategories.includes(law.category))
    })
  }

  private createNotificationSummary(diff: LawRegistryDiff): string {
    const parts = []
    
    if (diff.summary.totalNew > 0) {
      parts.push(`新規法令: ${diff.summary.totalNew}件`)
      diff.newLaws.forEach(law => {
        parts.push(`  - ${law.name} (${law.category})`)
      })
    }
    
    if (diff.summary.totalModified > 0) {
      parts.push(`変更法令: ${diff.summary.totalModified}件`)
      diff.modifiedLaws.forEach(law => {
        parts.push(`  - ${law.name} (${law.category})`)
      })
    }
    
    if (diff.summary.totalRemoved > 0) {
      parts.push(`廃止法令: ${diff.summary.totalRemoved}件`)
      diff.removedLaws.forEach(law => {
        parts.push(`  - ${law.name} (${law.category})`)
      })
    }
    
    return parts.join('\n')
  }
}
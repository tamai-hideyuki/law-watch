import { WatchListRepository } from '../ports/watch-list-repository'
import { EGovApi } from '../ports/e-gov-api'
import { NotificationRepository } from '../../application/ports/notification-repository'
import { SendNotificationUseCase } from './send-notification'
import { createLawChangeNotification, ChangeType, LawChangeNotification } from '../../domain/monitoring/entities/law-change-notification'
import { createLawId } from '../../domain/law'

export class DetectLawChangesUseCase {
  constructor(
    private readonly watchListRepository: WatchListRepository,
    private readonly egovApi: EGovApi,
    private readonly notificationRepository: NotificationRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase // 追加
  ) {}

  async execute(): Promise<LawChangeNotification[]> {
    // 1. すべてのウォッチリストを取得
    const watchLists = await this.watchListRepository.findAll()
    console.log(`Found ${watchLists.length} watch lists`)
    
    const notifications: LawChangeNotification[] = []

    // 2. 各ウォッチリストの法令をチェック
    for (const watchList of watchLists) {
      console.log(`Checking watch list: ${watchList.name} with ${watchList.lawIds.length} laws`)
      for (const lawId of watchList.lawIds) {
        try {
          // 3. 法令の最新情報を取得
          const currentLawData = await this.egovApi.getLawDetail(lawId)
          console.log(`Retrieved law data for ${lawId}: ${currentLawData.name}`)
          
          // 4. 変更を検出（簡易的な実装）
          const hasChanges = await this.detectChanges(lawId, currentLawData)
          console.log(`Change detection for ${lawId}: ${hasChanges}`)
          
          if (hasChanges) {
            // 5. 通知を作成
            const notification = createLawChangeNotification({
              id: this.generateNotificationId(),
              lawId: lawId,
              changeType: ChangeType.CONTENT_UPDATED,
              title: `${currentLawData.name}に変更が検出されました`,
              description: '法令の内容が更新されました。詳細をご確認ください。',
              detectedAt: new Date()
            })

            // 6. 通知を保存
            await this.notificationRepository.save(notification)
            
            // 7. メール通知を送信
            await this.sendNotificationUseCase.execute(notification)
            
            notifications.push(notification)
          }
        } catch (error) {
          console.error(`Failed to check law ${lawId}:`, error)
          // エラーが発生しても他の法令のチェックは続行
        }
      }
    }

    return notifications
  }

  private async detectChanges(lawId: any, currentLawData: any): Promise<boolean> {
    // 名前に「改正版」が含まれている場合は変更ありとみなす
    if (currentLawData.name.includes('改正版') || currentLawData.name.includes('令和7年改正版')) {
      return true
    }
  
    return false // 変更なし
  }

  private generateNotificationId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

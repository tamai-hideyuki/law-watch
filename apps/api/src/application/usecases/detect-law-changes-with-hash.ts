import { WatchListRepository } from '../ports/watch-list-repository'
import { EGovApi } from '../ports/e-gov-api'
import { NotificationRepository } from '../ports/notification-repository'
import { SnapshotRepository } from '../../infrastructure/database/prisma-snapshot-repository'
import { SendNotificationUseCase } from './send-notification'
import { HashService } from '../../domain/monitoring/services/hash-service'
import { createLawSnapshot } from '../../domain/monitoring/entities/law-snapshot'
import { createLawChangeNotification, ChangeType, LawChangeNotification } from '../../domain/monitoring/entities/law-change-notification'
import { LawId } from '../../domain/law'
import { createLogger } from '../../infrastructure/logging/logger'

export class DetectLawChangesWithHashUseCase {
  private readonly logger = createLogger('DetectLawChangesWithHashUseCase')
  private readonly hashService = new HashService()

  constructor(
    private readonly watchListRepository: WatchListRepository,
    private readonly egovApi: EGovApi,
    private readonly notificationRepository: NotificationRepository,
    private readonly snapshotRepository: SnapshotRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async execute(): Promise<LawChangeNotification[]> {
    const watchLists = await this.watchListRepository.findAll()
    this.logger.info('Starting law change detection', { 
      watchListCount: watchLists.length 
    })
    
    const notifications: LawChangeNotification[] = []
    const processedLawIds = new Set<string>()

    for (const watchList of watchLists) {
      for (const lawId of watchList.lawIds) {
        if (processedLawIds.has(lawId)) {
          continue
        }
        processedLawIds.add(lawId)

        try {
          const changeDetected = await this.checkLawForChanges(lawId)
          
          if (changeDetected) {
            const notification = changeDetected.notification
            await this.notificationRepository.save(notification)
            await this.sendNotificationUseCase.execute(notification)
            notifications.push(notification)
            
            this.logger.info('Change detected and notified', {
              lawId,
              changeType: changeDetected.changeType,
              changedFields: changeDetected.changedFields
            })
          }
        } catch (error) {
          this.logger.error('Failed to check law for changes', {
            lawId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    this.logger.info('Law change detection completed', {
      totalChecked: processedLawIds.size,
      changesDetected: notifications.length
    })

    return notifications
  }

  private async checkLawForChanges(lawId: LawId): Promise<{
    notification: LawChangeNotification
    changeType: ChangeType
    changedFields: string[]
  } | null> {
    const currentLawData = await this.egovApi.getLawDetail(lawId)
    const currentHash = this.hashService.generateContentHash(currentLawData)
    
    const existingSnapshot = await this.snapshotRepository.findByLawId(lawId)
    
    if (!existingSnapshot) {
      const newSnapshot = createLawSnapshot({
        lawId,
        contentHash: currentHash,
        metadata: {
          name: currentLawData.name,
          number: currentLawData.number,
          category: currentLawData.category,
          status: currentLawData.status,
          promulgationDate: currentLawData.promulgationDate
        },
        version: '1.0.0'
      })
      
      await this.snapshotRepository.save(newSnapshot)
      
      this.logger.info('Initial snapshot created', {
        lawId,
        hashPrefix: currentHash.substring(0, 8)
      })
      
      return null
    }

    const hasChanged = !this.hashService.compareHashes(
      existingSnapshot.contentHash,
      currentHash
    )
    
    if (!hasChanged) {
      existingSnapshot.lastChecked = new Date()
      await this.snapshotRepository.update(existingSnapshot)
      
      this.logger.debug('No changes detected', {
        lawId,
        lastChecked: existingSnapshot.lastChecked
      })
      
      return null
    }

    const changedFields = this.detectChangedFields(
      existingSnapshot.metadata,
      currentLawData
    )
    
    const changeType = this.determineChangeType(changedFields)
    
    existingSnapshot.contentHash = currentHash
    existingSnapshot.metadata = {
      name: currentLawData.name,
      number: currentLawData.number,
      category: currentLawData.category,
      status: currentLawData.status,
      promulgationDate: currentLawData.promulgationDate
    }
    existingSnapshot.lastChecked = new Date()
    existingSnapshot.version = this.incrementVersion(existingSnapshot.version)
    
    await this.snapshotRepository.update(existingSnapshot)
    
    const notification = createLawChangeNotification({
      id: this.generateNotificationId(),
      lawId,
      changeType,
      title: `${currentLawData.name}に変更が検出されました`,
      description: this.generateChangeDescription(changedFields, changeType),
      detectedAt: new Date()
    })
    
    return {
      notification,
      changeType,
      changedFields
    }
  }

  private detectChangedFields(
    oldMetadata: any,
    newData: any
  ): string[] {
    const fields: string[] = []
    
    if (!oldMetadata) return ['all']
    
    if (oldMetadata.name !== newData.name) fields.push('name')
    if (oldMetadata.number !== newData.number) fields.push('number')
    if (oldMetadata.category !== newData.category) fields.push('category')
    if (oldMetadata.status !== newData.status) fields.push('status')
    if (oldMetadata.promulgationDate !== newData.promulgationDate) {
      fields.push('promulgationDate')
    }
    
    return fields
  }

  private determineChangeType(changedFields: string[]): ChangeType {
    if (changedFields.includes('status')) {
      return ChangeType.STATUS_CHANGED
    }
    if (changedFields.includes('name') || changedFields.includes('number')) {
      return ChangeType.CONTENT_UPDATED
    }
    return ChangeType.CONTENT_UPDATED
  }

  private generateChangeDescription(
    changedFields: string[],
    changeType: ChangeType
  ): string {
    if (changeType === ChangeType.STATUS_CHANGED) {
      return '法令のステータスが変更されました。'
    }
    
    const fieldDescriptions: Record<string, string> = {
      name: '法令名',
      number: '法令番号',
      category: 'カテゴリ',
      status: 'ステータス',
      promulgationDate: '公布日'
    }
    
    const changedDescriptions = changedFields
      .filter(field => fieldDescriptions[field])
      .map(field => fieldDescriptions[field])
    
    if (changedDescriptions.length === 0) {
      return '法令の内容が更新されました。'
    }
    
    return `以下の項目が変更されました: ${changedDescriptions.join('、')}`
  }

  private incrementVersion(currentVersion?: string): string {
    if (!currentVersion) return '1.0.0'
    
    const parts = currentVersion.split('.')
    const patch = parseInt(parts[2] || '0') + 1
    return `${parts[0]}.${parts[1]}.${patch}`
  }

  private generateNotificationId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
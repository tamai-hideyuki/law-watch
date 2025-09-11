import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createLogger } from '../../infrastructure/logging/logger'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import type { LawRepository } from '../../application/ports/law-repository'
import type { NotificationRepository } from '../../application/ports/notification-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import type { SnapshotRepository } from '../../infrastructure/database/prisma-snapshot-repository'
import { createWatchManagementApp } from './watch-management'
import { createNotificationManagementApp } from './notification-management'
import { DetectLawChangesWithHashUseCase } from '../../application/usecases/detect-law-changes-with-hash'
import { SendNotificationUseCase } from '../../application/usecases/send-notification'
import { EmailService } from '../../infrastructure/notification/email-service'

export const createMonitoringApp = (
  watchListRepository: WatchListRepository,
  lawRepository: LawRepository,
  notificationRepository: NotificationRepository,
  snapshotRepository: SnapshotRepository,
  egovApi: EGovApi
) => {
  const app = new Hono()
  const logger = createLogger('MonitoringAPI')

  // CORS設定
  app.use('*', cors({
    origin: ['http://localhost:3001'],
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }))

  // エラーハンドリング
  app.onError((err, c) => {
    logger.error('Monitoring API error', { 
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    })
    return c.json({ error: 'Internal server error' }, 500)
  })

  // 監視管理機能
  const watchManagementApp = createWatchManagementApp(watchListRepository, lawRepository, egovApi, snapshotRepository)
  app.route('/', watchManagementApp)

  // 通知管理機能
  const notificationManagementApp = createNotificationManagementApp(
    watchListRepository,
    notificationRepository,
    egovApi
  )
  app.route('/', notificationManagementApp)

  // ハッシュベース変更検知エンドポイント
  const emailService = new EmailService()
  const sendNotificationUseCase = new SendNotificationUseCase(emailService)
  const detectChangesUseCase = new DetectLawChangesWithHashUseCase(
    watchListRepository,
    egovApi,
    notificationRepository,
    snapshotRepository,
    sendNotificationUseCase
  )

  app.post('/monitoring/detect-changes-hash', async (c) => {
    try {
      logger.info('Starting hash-based law change detection')
      
      const notifications = await detectChangesUseCase.execute()
      
      logger.info('Hash-based change detection completed', {
        notificationCount: notifications.length
      })

      return c.json({
        success: true,
        message: `変更検知が完了しました。${notifications.length}件の変更を検出しました。`,
        notifications: notifications.map(n => ({
          id: n.id,
          lawId: n.lawId,
          changeType: n.changeType,
          title: n.title,
          description: n.description,
          detectedAt: n.detectedAt
        })),
        executedAt: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Hash-based change detection failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return c.json({
        success: false,
        error: 'ハッシュベース変更検知に失敗しました'
      }, 500)
    }
  })

  return app
}
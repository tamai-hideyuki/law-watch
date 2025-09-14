import { Hono } from 'hono'
import { createLogger } from '../../infrastructure/logging/logger'
import { DetectLawChangesUseCase } from '../../application/usecases/detect-law-changes'
import { SendNotificationUseCase } from '../../application/usecases/send-notification'
import { EmailService } from '../../infrastructure/notification/email-service'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import type { NotificationRepository } from '../../application/ports/notification-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import { successResponse, errorResponse, badRequestResponse } from './responses/api-response'

export const createNotificationManagementApp = (
  watchListRepository: WatchListRepository,
  notificationRepository: NotificationRepository,
  egovApi: EGovApi
) => {
  const app = new Hono()
  const logger = createLogger('NotificationManagementAPI')

  // 通知一覧取得
  app.get('/monitoring/notifications/:userId', async (c) => {
    try {
      const userId = c.req.param('userId')

      if (!userId) {
        return badRequestResponse(c, 'userId is required')
      }

      const notifications = await notificationRepository.findByUserId(userId)

      return successResponse(c, undefined, {
        notifications: notifications.map(notification => ({
          id: notification.id,
          lawId: notification.lawId,
          changeType: notification.changeType,
          title: notification.title,
          description: notification.description,
          isRead: notification.isRead,
          detectedAt: notification.detectedAt,
          readAt: notification.readAt
        }))
      })
    } catch (error) {
      logger.error('Get notifications failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // 変更検知実行
  app.post('/monitoring/detect-changes', async (c) => {
    try {
      const emailService = new EmailService()
      const sendNotificationUseCase = new SendNotificationUseCase(emailService)
      
      const detectChangesUseCase = new DetectLawChangesUseCase(
        watchListRepository,
        egovApi,
        notificationRepository,
        sendNotificationUseCase
      )
      
      const notifications = await detectChangesUseCase.execute()

      return successResponse(c, undefined, {
        detectedChanges: notifications.length,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          changeType: n.changeType
        }))
      })
    } catch (error) {
      logger.error('Detect changes failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // 変更シミュレーション用エンドポイント（テスト用）
  app.post('/monitoring/simulate-change', async (c) => {
    try {
      // EGovApiクライアントで変更をシミュレート
      if ('simulateChange' in egovApi) {
        (egovApi as { simulateChange: () => void }).simulateChange()
      }

      return successResponse(c, undefined, {
        message: 'Law change simulated'
      })
    } catch (error) {
      logger.error('Simulate change failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // 変更リセット用エンドポイント（テスト用）
  app.post('/monitoring/reset-changes', async (c) => {
    try {
      // EGovApiクライアントで変更をリセット
      if ('resetChanges' in egovApi) {
        (egovApi as { resetChanges: () => void }).resetChanges()
      }

      return successResponse(c, undefined, {
        message: 'Law changes reset'
      })
    } catch (error) {
      logger.error('Reset changes failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // 通知を既読にマーク
  app.put('/monitoring/notifications/:notificationId/read', async (c) => {
    try {
      const notificationId = c.req.param('notificationId')

      if (!notificationId) {
        return badRequestResponse(c, 'notificationId is required')
      }

      // 通知を既読にマーク（実装はモック）
      return successResponse(c, undefined, {
        message: 'Notification marked as read',
        notificationId
      })
    } catch (error) {
      logger.error('Mark notification as read failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  return app
}
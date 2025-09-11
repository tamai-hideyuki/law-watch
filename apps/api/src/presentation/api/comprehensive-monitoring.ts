import { Hono } from 'hono'
import { validateRequired, ValidationError } from './validation/request-validator'
import { successResponse, errorResponse } from './responses/api-response'
import { ComprehensiveLawMonitoringUseCaseImpl } from '../../application/usecases/comprehensive-law-monitoring'
import { RealEGovClient } from '../../infrastructure/e-gov/real-e-gov-client'
import { PrismaLawRegistryRepository } from '../../infrastructure/persistence/prisma-law-registry-repository'
import { PrismaNotificationRepository } from '../../infrastructure/database/prisma-notification-repository'
import { PrismaClient } from '@prisma/client'
import { getJapanTimeFormatted } from '../../infrastructure/utils/timezone'

const app = new Hono()

// 依存性注入
const prisma = new PrismaClient()
const eGovClient = new RealEGovClient()
const lawRegistryRepository = new PrismaLawRegistryRepository(prisma)
const notificationRepository = new PrismaNotificationRepository(prisma)

const comprehensiveLawMonitoringUseCase = new ComprehensiveLawMonitoringUseCaseImpl(
  eGovClient,
  lawRegistryRepository,
  notificationRepository
)

// 包括的監視の作成
app.post('/create', async (c) => {
  try {
    const body = await c.req.json()
    
    const errors: ValidationError[] = []
    
    const userIdError = validateRequired(body.userId, 'userId')
    if (userIdError) errors.push(userIdError)
    
    const nameError = validateRequired(body.name, 'name')
    if (nameError) errors.push(nameError)

    if (errors.length > 0) {
      return errorResponse(c, errors[0].message, 400)
    }

    const result = await comprehensiveLawMonitoringUseCase.createComprehensiveMonitoring({
      userId: body.userId,
      name: body.name,
      targetCategories: body.targetCategories,
      notifyOnNew: body.notifyOnNew,
      notifyOnModified: body.notifyOnModified,
      notifyOnRemoved: body.notifyOnRemoved
    })

    if (!result.success) {
      return errorResponse(c, result.error, 500)
    }

    return successResponse(c, result.data)
  } catch (error) {
    console.error('包括的監視作成エラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// 包括的監視の実行（手動）
app.post('/execute', async (c) => {
  try {
    const result = await comprehensiveLawMonitoringUseCase.executeComprehensiveCheck()

    if (!result.success) {
      return errorResponse(c, result.error, 500)
    }

    const responseData = {
      executed: true,
      detectedChanges: result.data !== null,
      diff: result.data
    }

    return successResponse(c, responseData)
  } catch (error) {
    console.error('包括的監視実行エラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// ユーザーの包括的監視一覧取得
app.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')

    if (!userId) {
      return errorResponse(c, 'ユーザーIDが必要です', 400)
    }

    const result = await comprehensiveLawMonitoringUseCase.getComprehensiveMonitoringByUserId(userId)

    if (!result.success) {
      return errorResponse(c, result.error, 500)
    }

    return successResponse(c, result.data)
  } catch (error) {
    console.error('包括的監視一覧取得エラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// ユーザーの包括的通知一覧取得
app.get('/notifications/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')

    if (!userId) {
      return errorResponse(c, 'ユーザーIDが必要です', 400)
    }

    const result = await comprehensiveLawMonitoringUseCase.getComprehensiveNotificationsByUserId(userId)

    if (!result.success) {
      return errorResponse(c, result.error, 500)
    }

    return successResponse(c, result.data)
  } catch (error) {
    console.error('包括的通知一覧取得エラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// 通知を既読にマーク
app.put('/notifications/:notificationId/read', async (c) => {
  try {
    const notificationId = c.req.param('notificationId')

    if (!notificationId) {
      return errorResponse(c, '通知IDが必要です', 400)
    }

    const result = await lawRegistryRepository.markNotificationAsRead(notificationId)

    if (!result.success) {
      return errorResponse(c, result.error, 500)
    }

    return successResponse(c, { marked: true })
  } catch (error) {
    console.error('通知既読マークエラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// フルスキャン実行（実際のe-Gov APIからデータベースに保存）
app.post('/scan', async (c) => {
  try {
    const result = await comprehensiveLawMonitoringUseCase.executeComprehensiveCheck()

    if (!result.success) {
      return errorResponse(c, result.error, 500)
    }

    const responseData = {
      executed: true,
      detectedChanges: result.data !== null,
      diff: result.data,
      message: '全法令スキャンが完了し、データベースに保存されました',
      executedAt: getJapanTimeFormatted(), // 実行時刻を日本時間で表示
      timezone: 'Asia/Tokyo (JST)'
    }

    return successResponse(c, responseData)
  } catch (error) {
    console.error('フルスキャンエラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// 最近の変更差分取得（詳細版）
app.get('/diffs', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10')
    const result = await lawRegistryRepository.getRecentDiffs(limit)

    if (!result.success) {
      return errorResponse(c, result.error, 500)
    }

    const responseData = {
      diffs: result.data,
      count: result.data.length,
      retrievedAt: getJapanTimeFormatted(),
      timezone: 'Asia/Tokyo (JST)'
    }

    return successResponse(c, responseData)
  } catch (error) {
    console.error('差分取得エラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// 特定の差分詳細取得
app.get('/diffs/:diffId', async (c) => {
  try {
    const diffId = c.req.param('diffId')
    // TODO: 実装時はgetDiffByIdメソッドを追加
    return errorResponse(c, '機能は実装予定です', 501)
  } catch (error) {
    console.error('差分詳細取得エラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

export default app
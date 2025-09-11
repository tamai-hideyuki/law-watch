import { Hono } from 'hono'
import { validateRequired, ValidationError } from './validation/request-validator'
import { successResponse, errorResponse } from './responses/api-response'
import { ComprehensiveLawMonitoringUseCaseImpl } from '../../application/usecases/comprehensive-law-monitoring'
import { MockEGovClient } from '../../infrastructure/e-gov/mock-e-gov-client'
import { PrismaLawRegistryRepository } from '../../infrastructure/persistence/prisma-law-registry-repository'
import { PrismaNotificationRepository } from '../../infrastructure/database/prisma-notification-repository'
import { PrismaClient } from '@prisma/client'

const app = new Hono()

// 依存性注入
const prisma = new PrismaClient()
const eGovClient = new MockEGovClient()
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

// 法令変更シミュレーション（テスト用）
app.post('/simulate-change', async (c) => {
  try {
    eGovClient.simulateChange()
    
    return successResponse(c, { 
      message: '法令変更をシミュレートしました。次回の包括的監視で変更が検知されます。',
      simulated: true
    })
  } catch (error) {
    console.error('変更シミュレーションエラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

// 変更シミュレーションのリセット（テスト用）
app.post('/reset-changes', async (c) => {
  try {
    eGovClient.resetChanges()
    
    return successResponse(c, { 
      message: '法令変更シミュレーションをリセットしました。',
      reset: true
    })
  } catch (error) {
    console.error('変更リセットエラー:', error)
    return errorResponse(c, '内部サーバーエラー', 500)
  }
})

export default app
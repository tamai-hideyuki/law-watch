import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { AddLawToWatchListUseCase } from '../../application/usecases/add-law-to-watch-list'
import { createLawId } from '../../domain/law'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import { CreateWatchListUseCase } from '../../application/usecases/create-watch-list'
import { RemoveLawFromWatchListUseCase } from '../../application/usecases/remove-law-from-watch-list'
import { NotificationRepository } from '../../application/ports/notification-repository'
import { DetectLawChangesUseCase } from '../../application/usecases/detect-law-changes'
import { EGovApi } from '../../application/ports/e-gov-api'

export const createMonitoringApp = (
  watchListRepository: WatchListRepository,
  notificationRepository: NotificationRepository,
  egovApi: EGovApi
) => {
  const app = new Hono()

  // CORS設定
  app.use('*', cors({
    origin: ['http://localhost:3001'],
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }))

  // エラーハンドリング
  app.onError((err, c) => {
    console.error('Monitoring API Error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  // ウォッチリストに法令を追加
  app.post('/monitoring/watch', async (c) => {
    try {
      const body = await c.req.json()
      const { watchListId, lawId } = body

      // バリデーション
      if (!watchListId) {
        return c.json({ error: 'watchListId is required' }, 400)
      }
      if (!lawId) {
        return c.json({ error: 'lawId is required' }, 400)
      }

      // ビジネスロジックを実行
      const addLawUseCase = new AddLawToWatchListUseCase(watchListRepository)
      const lawIdObj = createLawId(lawId)
      const updatedWatchList = await addLawUseCase.execute(watchListId, lawIdObj)

      // レスポンスを返す
      return c.json({
        success: true,
        watchList: {
          id: updatedWatchList.id,
          name: updatedWatchList.name,
          lawIds: updatedWatchList.lawIds,
          updatedAt: updatedWatchList.updatedAt
        }
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Watch list not found') {
        return c.json({ error: 'Watch list not found' }, 404)
      }
      throw error // 他のエラーはonErrorで処理
    }
  })

  // ウォッチリスト一覧取得
  app.get('/monitoring/watch/:userId', async (c) => {
    try {
      const userId = c.req.param('userId')

      if (!userId) {
        return c.json({ error: 'userId is required' }, 400)
      }

      const watchLists = await watchListRepository.findByUserId(userId)

      return c.json({
        success: true,
        watchLists: watchLists.map(watchList => ({
          id: watchList.id,
          name: watchList.name,
          lawIds: watchList.lawIds,
          createdAt: watchList.createdAt,
          updatedAt: watchList.updatedAt
        }))
      })
    } catch (error) {
      throw error // onErrorで処理
    }
  })

  // 特定のウォッチリスト取得
  app.get('/monitoring/watch/detail/:watchListId', async (c) => {
    try {
      const watchListId = c.req.param('watchListId')

      if (!watchListId) {
        return c.json({ error: 'watchListId is required' }, 400)
      }

      const watchList = await watchListRepository.findById(watchListId)

      if (!watchList) {
        return c.json({ error: 'Watch list not found' }, 404)
      }

      return c.json({
        success: true,
        watchList: {
          id: watchList.id,
          name: watchList.name,
          lawIds: watchList.lawIds,
          createdAt: watchList.createdAt,
          updatedAt: watchList.updatedAt
        }
      })
    } catch (error) {
      throw error // onErrorで処理
    }
  })

  // ウォッチリスト作成
  app.post('/monitoring/watch-list', async (c) => {
    try {
      const body = await c.req.json()
      const { userId, name } = body

      if (!userId) {
        return c.json({ error: 'userId is required' }, 400)
      }
      if (!name) {
        return c.json({ error: 'name is required' }, 400)
      }

      const createWatchListUseCase = new CreateWatchListUseCase(watchListRepository)
      const watchList = await createWatchListUseCase.execute(userId, name)

      return c.json({ success: true, watchList })
    } catch (error) {
      throw error
    }
  })

  // ウォッチリストから法令を削除
  app.delete('/monitoring/watch/:watchListId/:lawId', async (c) => {
    try {
      const watchListId = c.req.param('watchListId')
      const lawId = c.req.param('lawId')

      if (!watchListId) {
        return c.json({ error: 'watchListId is required' }, 400)
      }
      if (!lawId) {
        return c.json({ error: 'lawId is required' }, 400)
      }

      const removeLawUseCase = new RemoveLawFromWatchListUseCase(watchListRepository)
      const lawIdObj = createLawId(lawId)
      const updatedWatchList = await removeLawUseCase.execute(watchListId, lawIdObj)

      return c.json({
        success: true,
        watchList: {
          id: updatedWatchList.id,
          name: updatedWatchList.name,
          lawIds: updatedWatchList.lawIds,
          updatedAt: updatedWatchList.updatedAt
        }
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Watch list not found') {
        return c.json({ error: 'Watch list not found' }, 404)
      }
      throw error
    }
  })

   // 通知一覧取得
   app.get('/monitoring/notifications/:userId', async (c) => {
    try {
      const userId = c.req.param('userId')

      if (!userId) {
        return c.json({ error: 'userId is required' }, 400)
      }

      const notifications = await notificationRepository.findByUserId(userId)

      return c.json({
        success: true,
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
      throw error
    }
  })

  // 変更検知実行
  app.post('/monitoring/detect-changes', async (c) => {
    try {
      const detectChangesUseCase = new DetectLawChangesUseCase(
        watchListRepository,
        egovApi,
        notificationRepository
      )
      
      const notifications = await detectChangesUseCase.execute()

      return c.json({
        success: true,
        detectedChanges: notifications.length,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          changeType: n.changeType
        }))
      })
    } catch (error) {
      throw error
    }
  })

  // 変更シミュレーション用エンドポイント（テスト用）
app.post('/monitoring/simulate-change', async (c) => {
  try {
    // EGovApiクライアントで変更をシミュレート
    if ('simulateChange' in egovApi) {
      (egovApi as any).simulateChange()
    }

    return c.json({
      success: true,
      message: 'Law change simulated'
    })
  } catch (error) {
    throw error
  }
})

  return app
}

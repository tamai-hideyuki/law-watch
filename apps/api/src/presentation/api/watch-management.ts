import { Hono } from 'hono'
import { createLogger } from '../../infrastructure/logging/logger'
import { AddLawToWatchListUseCase } from '../../application/usecases/add-law-to-watch-list'
import { CreateWatchListUseCase } from '../../application/usecases/create-watch-list'
import { RemoveLawFromWatchListUseCase } from '../../application/usecases/remove-law-from-watch-list'
import { createLawId } from '../../domain/law'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import { validateWatchRequest, validateWatchListRequest, handleValidationError } from './validation/request-validator'
import { successResponse, errorResponse, notFoundResponse, badRequestResponse } from './responses/api-response'

export const createWatchManagementApp = (watchListRepository: WatchListRepository) => {
  const app = new Hono()
  const logger = createLogger('WatchManagementAPI')

  // ウォッチリストに法令を追加
  app.post('/monitoring/watch', async (c) => {
    try {
      const body = await c.req.json()
      const validation = validateWatchRequest(body)
      
      if (!validation.isValid) {
        return handleValidationError(c, validation)
      }

      const { watchListId, lawId } = body
      const addLawUseCase = new AddLawToWatchListUseCase(watchListRepository)
      const lawIdObj = createLawId(lawId)
      const updatedWatchList = await addLawUseCase.execute(watchListId, lawIdObj)

      return successResponse(c, undefined, {
        watchList: {
          id: updatedWatchList.id,
          name: updatedWatchList.name,
          lawIds: updatedWatchList.lawIds,
          updatedAt: updatedWatchList.updatedAt
        }
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Watch list not found') {
        return notFoundResponse(c, 'Watch list')
      }
      logger.error('Add law to watch list failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // ウォッチリスト一覧取得
  app.get('/monitoring/watch/:userId', async (c) => {
    try {
      const userId = c.req.param('userId')

      if (!userId) {
        return badRequestResponse(c, 'userId is required')
      }

      const watchLists = await watchListRepository.findByUserId(userId)

      return successResponse(c, undefined, {
        watchLists: watchLists.map(watchList => ({
          id: watchList.id,
          name: watchList.name,
          lawIds: watchList.lawIds,
          createdAt: watchList.createdAt,
          updatedAt: watchList.updatedAt
        }))
      })
    } catch (error) {
      logger.error('Get watch lists failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // 特定のウォッチリスト取得
  app.get('/monitoring/watch/detail/:watchListId', async (c) => {
    try {
      const watchListId = c.req.param('watchListId')

      if (!watchListId) {
        return badRequestResponse(c, 'watchListId is required')
      }

      const watchList = await watchListRepository.findById(watchListId)

      if (!watchList) {
        return notFoundResponse(c, 'Watch list')
      }

      return successResponse(c, undefined, {
        watchList: {
          id: watchList.id,
          name: watchList.name,
          lawIds: watchList.lawIds,
          createdAt: watchList.createdAt,
          updatedAt: watchList.updatedAt
        }
      })
    } catch (error) {
      logger.error('Get watch list detail failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // ウォッチリスト作成
  app.post('/monitoring/watch-list', async (c) => {
    try {
      const body = await c.req.json()
      const validation = validateWatchListRequest(body)
      
      if (!validation.isValid) {
        return handleValidationError(c, validation)
      }

      const { userId, name } = body
      const createWatchListUseCase = new CreateWatchListUseCase(watchListRepository)
      const watchList = await createWatchListUseCase.execute(userId, name)

      return successResponse(c, undefined, { watchList })
    } catch (error) {
      logger.error('Create watch list failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // ウォッチリストから法令を削除
  app.delete('/monitoring/watch/:watchListId/:lawId', async (c) => {
    try {
      const watchListId = c.req.param('watchListId')
      const lawId = c.req.param('lawId')

      if (!watchListId) {
        return badRequestResponse(c, 'watchListId is required')
      }
      if (!lawId) {
        return badRequestResponse(c, 'lawId is required')
      }

      const removeLawUseCase = new RemoveLawFromWatchListUseCase(watchListRepository)
      const lawIdObj = createLawId(lawId)
      const updatedWatchList = await removeLawUseCase.execute(watchListId, lawIdObj)

      return successResponse(c, undefined, {
        watchList: {
          id: updatedWatchList.id,
          name: updatedWatchList.name,
          lawIds: updatedWatchList.lawIds,
          updatedAt: updatedWatchList.updatedAt
        }
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Watch list not found') {
        return notFoundResponse(c, 'Watch list')
      }
      logger.error('Remove law from watch list failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  return app
}
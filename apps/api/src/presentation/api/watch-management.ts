import { Hono } from 'hono'
import { createLogger } from '../../infrastructure/logging/logger'
import { AddLawToMonitoringUseCase } from '../../application/usecases/add-law-to-monitoring'
import { CreateWatchListUseCase } from '../../application/usecases/create-watch-list'
import { RemoveLawFromWatchListUseCase } from '../../application/usecases/remove-law-from-watch-list'
import { DeleteWatchListUseCase } from '../../application/usecases/delete-watch-list'
import { BulkRemoveLawsUseCase } from '../../application/usecases/bulk-remove-laws'
import { UpdateWatchListUseCase } from '../../application/usecases/update-watch-list'
import { createLawId } from '../../domain/law'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import type { LawRepository } from '../../application/ports/law-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import { validateWatchRequest, validateWatchListRequest, validateUpdateWatchListRequest, handleValidationError } from './validation/request-validator'
import { successResponse, errorResponse, notFoundResponse, badRequestResponse } from './responses/api-response'

import { SnapshotRepository } from '../../infrastructure/database/prisma-snapshot-repository'

export const createWatchManagementApp = (
  watchListRepository: WatchListRepository,
  lawRepository: LawRepository,
  eGovClient: EGovApi,
  snapshotRepository?: SnapshotRepository
) => {
  const app = new Hono()
  const logger = createLogger('WatchManagementAPI')

  // ウォッチリストに法令を追加（e-Gov APIから法令データを取得して保存）
  app.post('/monitoring/watch', async (c) => {
    try {
      const body = await c.req.json()
      const validation = validateWatchRequest(body)
      
      if (!validation.isValid) {
        return handleValidationError(c, validation)
      }

      const { watchListId, lawId } = body
      const addLawUseCase = new AddLawToMonitoringUseCase(watchListRepository, lawRepository, eGovClient, snapshotRepository)
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

  // ウォッチリスト名更新
  app.put('/monitoring/watch-list/:watchListId', async (c) => {
    try {
      const watchListId = c.req.param('watchListId')
      const body = await c.req.json()
      const validation = validateUpdateWatchListRequest(body)
      
      if (!watchListId) {
        return badRequestResponse(c, 'watchListId is required')
      }
      
      if (!validation.isValid) {
        return handleValidationError(c, validation)
      }

      const { userId, name } = body
      const updateWatchListUseCase = new UpdateWatchListUseCase(watchListRepository)
      const result = await updateWatchListUseCase.execute(watchListId, userId, name)

      if (!result.success) {
        if (result.error === 'Watch list not found') {
          return notFoundResponse(c, 'Watch list')
        }
        if (result.error.includes('Unauthorized')) {
          return c.json({ success: false, error: 'Unauthorized' }, 403)
        }
        return badRequestResponse(c, result.error)
      }

      // 更新後の監視リストを取得して返す
      const updatedWatchList = await watchListRepository.findById(watchListId)
      
      return successResponse(c, undefined, {
        message: 'Watch list name updated successfully',
        watchList: {
          id: updatedWatchList!.id,
          name: updatedWatchList!.name,
          lawIds: updatedWatchList!.lawIds,
          createdAt: updatedWatchList!.createdAt,
          updatedAt: updatedWatchList!.updatedAt
        }
      })
    } catch (error) {
      logger.error('Update watch list failed', { 
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

  // 監視リスト削除
  app.delete('/monitoring/watch-list/:watchListId', async (c) => {
    try {
      const watchListId = c.req.param('watchListId')
      const userId = c.req.query('userId')

      if (!watchListId) {
        return badRequestResponse(c, 'watchListId is required')
      }
      if (!userId) {
        return badRequestResponse(c, 'userId is required')
      }

      const deleteWatchListUseCase = new DeleteWatchListUseCase(watchListRepository)
      await deleteWatchListUseCase.execute(watchListId, userId)

      return successResponse(c, 'Watch list deleted successfully')
    } catch (error) {
      if (error instanceof Error && error.message === 'Watch list not found') {
        return notFoundResponse(c, 'Watch list')
      }
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return c.json({ success: false, error: 'Unauthorized' }, 403)
      }
      logger.error('Delete watch list failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  // 複数法令の一括削除
  app.delete('/monitoring/watch/:watchListId/bulk', async (c) => {
    try {
      const watchListId = c.req.param('watchListId')
      const body = await c.req.json()
      const { lawIds } = body

      if (!watchListId) {
        return badRequestResponse(c, 'watchListId is required')
      }
      if (!lawIds || !Array.isArray(lawIds) || lawIds.length === 0) {
        return badRequestResponse(c, 'lawIds array is required')
      }

      const lawIdObjects = lawIds.map(id => createLawId(id))
      const bulkRemoveUseCase = new BulkRemoveLawsUseCase(watchListRepository)
      const updatedWatchList = await bulkRemoveUseCase.execute(watchListId, lawIdObjects)

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
      logger.error('Bulk remove laws failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return errorResponse(c, 'Internal server error')
    }
  })

  return app
}
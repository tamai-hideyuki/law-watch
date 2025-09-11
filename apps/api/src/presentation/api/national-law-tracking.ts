import { Hono } from 'hono'
import { createApiResponse, createErrorResponse } from './api-response'
import { NationalLawTrackerUseCaseImpl } from '../../application/usecases/national-law-tracker'
import { MockNationalLawTrackerRepository } from '../../infrastructure/repositories/mock-national-law-tracker-repository'
import { container } from '../../infrastructure/container/dependency-injection'
import { createLogger } from '../../infrastructure/logging/logger'

const app = new Hono()
const logger = createLogger('NationalLawTrackingAPI')

// 依存性の注入
const eGovApi = container.getEGovApi()
const repository = new MockNationalLawTrackerRepository() // TODO: Prisma実装に置き換え
const useCase = new NationalLawTrackerUseCaseImpl(eGovApi, repository)

/**
 * 日本全法令の手動スキャン実行
 * POST /national-tracking/scan
 */
app.post('/scan', async (c) => {
  try {
    logger.info('Starting manual full scan of all Japanese laws')
    
    // 非同期でスキャンを開始（レスポンスはすぐ返す）
    const scanPromise = useCase.performDailyFullScan()
    
    // スキャンは継続させつつ、即座にレスポンスを返す
    scanPromise.then(result => {
      if (result.success) {
        logger.info('Full scan completed successfully', {
          scanId: result.data.scanId,
          totalScanned: result.data.totalLawsScanned,
          changes: {
            new: result.data.newLaws.length,
            revised: result.data.revisedLaws.length,
            abolished: result.data.abolishedLaws.length,
            metadata: result.data.metadataChanges.length
          }
        })
      } else {
        logger.error('Full scan failed', { error: result.error })
      }
    }).catch(error => {
      logger.error('Unexpected error during scan', { error })
    })
    
    return c.json(createApiResponse({
      message: 'スキャンを開始しました。完了まで数分かかる場合があります。',
      status: 'STARTED'
    }))
    
  } catch (error) {
    logger.error('Failed to start scan', { error })
    return c.json(
      createErrorResponse('スキャンの開始に失敗しました'),
      500
    )
  }
})

/**
 * 増分スキャン（前回からの差分のみ）
 * POST /national-tracking/scan-incremental
 */
app.post('/scan-incremental', async (c) => {
  try {
    logger.info('Starting incremental scan')
    
    const result = await useCase.performIncrementalScan()
    
    if (result.success) {
      return c.json(createApiResponse({
        scanId: result.data.scanId,
        totalScanned: result.data.totalLawsScanned,
        changes: {
          new: result.data.newLaws.length,
          revised: result.data.revisedLaws.length,
          abolished: result.data.abolishedLaws.length,
          metadata: result.data.metadataChanges.length
        },
        completedAt: result.data.completedAt
      }))
    } else {
      return c.json(createErrorResponse(result.error), 500)
    }
    
  } catch (error) {
    logger.error('Incremental scan failed', { error })
    return c.json(
      createErrorResponse('増分スキャンに失敗しました'),
      500
    )
  }
})

/**
 * カテゴリ別スキャン
 * POST /national-tracking/scan-category
 */
app.post('/scan-category', async (c) => {
  try {
    const body = await c.req.json()
    const { categories } = body
    
    if (!categories || !Array.isArray(categories)) {
      return c.json(
        createErrorResponse('カテゴリを指定してください'),
        400
      )
    }
    
    logger.info('Starting category scan', { categories })
    
    const result = await useCase.performCategoryScan(categories)
    
    if (result.success) {
      return c.json(createApiResponse({
        scanId: result.data.scanId,
        categories,
        totalScanned: result.data.totalLawsScanned,
        changes: {
          new: result.data.newLaws.length,
          revised: result.data.revisedLaws.length,
          abolished: result.data.abolishedLaws.length,
          metadata: result.data.metadataChanges.length
        }
      }))
    } else {
      return c.json(createErrorResponse(result.error), 500)
    }
    
  } catch (error) {
    logger.error('Category scan failed', { error })
    return c.json(
      createErrorResponse('カテゴリスキャンに失敗しました'),
      500
    )
  }
})

/**
 * 最近の変更を取得
 * GET /national-tracking/recent-changes?days=7
 */
app.get('/recent-changes', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7')
    
    const result = await useCase.getRecentChanges(days)
    
    if (result.success) {
      return c.json(createApiResponse({
        days,
        totalChanges: result.data.length,
        changes: result.data.map(change => ({
          lawId: change.lawId,
          lawName: change.lawName,
          changeType: change.changeType,
          detectedAt: change.detectedAt,
          changes: change.changes
        }))
      }))
    } else {
      return c.json(createErrorResponse(result.error), 500)
    }
    
  } catch (error) {
    logger.error('Failed to get recent changes', { error })
    return c.json(
      createErrorResponse('変更履歴の取得に失敗しました'),
      500
    )
  }
})

/**
 * スキャン統計を取得
 * GET /national-tracking/statistics
 */
app.get('/statistics', async (c) => {
  try {
    const result = await useCase.getScanStatistics()
    
    if (result.success) {
      return c.json(createApiResponse(result.data))
    } else {
      return c.json(createErrorResponse(result.error), 500)
    }
    
  } catch (error) {
    logger.error('Failed to get statistics', { error })
    return c.json(
      createErrorResponse('統計情報の取得に失敗しました'),
      500
    )
  }
})

export { app as nationalLawTrackingApp }
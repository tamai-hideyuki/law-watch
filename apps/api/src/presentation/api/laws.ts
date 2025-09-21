import { Hono } from 'hono'
import { GetMonitoredLawsUseCase } from '../../application/usecases/get-monitored-laws'
import type { LawRepository } from '../../application/ports/law-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import { cors } from 'hono/cors'
import { createLogger } from '../../infrastructure/logging/logger'
import { createLawId } from '../../domain/law/value-objects/law-id'

export const createLawsApp = (lawRepository: LawRepository, egovApi: EGovApi) => {
    const app = new Hono()
    const logger = createLogger('LawsAPI')

    app.use('*', cors({
      origin: ['http://localhost:3001'],
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'POST', 'DELETE'],
    }))

    const getMonitoredLawsUseCase = new GetMonitoredLawsUseCase(lawRepository)
  
    app.onError((err, c) => {
      logger.error('Laws API error', { 
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      return c.json({ error: 'Internal server error' }, 500)
    })
  
    app.get('/laws', async (c) => {
      // 監視対象として登録されている法令のみを取得
      const result = await getMonitoredLawsUseCase.execute()

      return c.json({
        totalCount: result.totalCount,
        laws: result.laws,
        executedAt: result.executedAt
      })
    })

    // 特定の法令詳細を取得
    app.get('/laws/:lawId', async (c) => {
      const lawIdString = c.req.param('lawId')

      try {
        const lawId = createLawId(lawIdString)
        const law = await lawRepository.findById(lawId)

        if (!law) {
          return c.json({ error: 'Law not found' }, 404)
        }

        return c.json({
          id: law.id,
          name: law.name,
          number: law.number,
          category: law.category,
          status: law.status,
          promulgationDate: law.promulgationDate,
          detailUrl: `https://elaws.e-gov.go.jp/document?lawid=${law.id}`
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Error fetching law: ${lawIdString}`, { error: errorMessage })
        return c.json({ error: errorMessage }, 500)
      }
    })

    // 孤立した法令データを削除するためのエンドポイント
    app.delete('/laws/:lawId', async (c) => {
      const lawIdString = c.req.param('lawId')
      
      try {
        const lawId = createLawId(lawIdString)
        const result = await lawRepository.delete(lawId)
        if (result.success) {
          logger.info(`Law deleted: ${lawIdString}`)
          return c.json({ success: true, message: `Law ${lawIdString} deleted` })
        } else {
          logger.error(`Failed to delete law: ${lawIdString}`, { error: result.error })
          return c.json({ success: false, error: result.error }, 400)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Error deleting law: ${lawIdString}`, { error: errorMessage })
        return c.json({ success: false, error: errorMessage }, 500)
      }
    })
  
    return app
  }
import { Hono } from 'hono'
import { SearchLawsUseCase } from '../../application/usecases/search-laws'
import { createSimpleSearchQuery } from '../../domain/law'
import type { LawRepository } from '../../application/ports/law-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import { cors } from 'hono/cors'

export const createLawsApp = (lawRepository: LawRepository, egovApi: EGovApi) => {
    const app = new Hono()

    app.use('*', cors({
      origin: ['http://localhost:3001'],
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'POST'],
    }))

    const searchUseCase = new SearchLawsUseCase(lawRepository, egovApi)
  
    app.onError((err, c) => {
      console.error(err)
      return c.json({ error: 'Internal server error' }, 500)
    })
  
    app.get('/laws', async (c) => {
      // 全法令取得のため特別なクエリマーカーを使用してみた
      const searchQuery = createSimpleSearchQuery('__ALL_LAWS__')
      const result = await searchUseCase.execute(searchQuery)
      
      return c.json({
        totalCount: result.totalCount,
        laws: result.laws,
        executedAt: result.executedAt
      })
    })
  
    return app
  }
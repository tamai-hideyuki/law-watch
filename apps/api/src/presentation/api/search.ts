import { Hono } from 'hono'
import { SearchLawsUseCase } from '../../application/usecases/search-laws'
import { createSimpleSearchQuery } from '../../domain/law'
import type { LawRepository } from '../../application/ports/law-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import { cors } from 'hono/cors'
import { createLogger } from '../../infrastructure/logging/logger'

export const createSearchApp = (lawRepository: LawRepository, egovApi: EGovApi) => {
    const app = new Hono()
    const logger = createLogger('SearchAPI')

    app.use('*', cors({
      origin: ['http://localhost:3001'],
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'POST'],
    }))

    const searchUseCase = new SearchLawsUseCase(lawRepository, egovApi)
  
    app.onError((err, c) => {
      logger.error('Search API error', { 
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      return c.json({ error: 'Internal server error' }, 500)
    })
  
    app.get('/search', async (c) => {
      const query = c.req.query('q')
      
      if (!query) {
        return c.json({ error: 'Query parameter is required' }, 400)
      }
  
      const searchQuery = createSimpleSearchQuery(query)
      const result = await searchUseCase.execute(searchQuery)
      
      return c.json({
        query: query,
        totalCount: result.totalCount,
        laws: result.laws,
        executedAt: result.executedAt
      })
    })
  
    return app
  }

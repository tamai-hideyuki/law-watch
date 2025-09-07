import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { createSearchApp } from './presentation/api/search'
import { MockEGovClient } from './infrastructure/e-gov/mock-e-gov-client'

const mockLawRepository = {
  save: async () => {},
  findById: async () => null,
  search: async () => { throw new Error('Use EGovApi for search') }
}

const egovClient = new MockEGovClient()
const app = createSearchApp(mockLawRepository, egovClient)

app.use('/*', cors({
  origin: 'http://localhost:3001',
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

const port = 3000
console.log(`🔥 Law Watch API running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createSearchApp } from './presentation/api/search'
import { createLawsApp } from './presentation/api/laws'
import { MockEGovClient } from './infrastructure/e-gov/mock-e-gov-client'

const mockLawRepository = {
  save: async () => {},
  findById: async () => null,
  search: async () => { throw new Error('Use EGovApi for search') }
}

const egovClient = new MockEGovClient()

// メインアプリを作成する。
const app = new Hono()

// CORSを設定
app.use('/*', cors({
  origin: 'http://localhost:3001',
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

// 各エンドポイントアプリを統合する。
const searchApp = createSearchApp(mockLawRepository, egovClient)
const lawsApp = createLawsApp(mockLawRepository, egovClient)

app.route('/', searchApp)
app.route('/', lawsApp)

const port = 3000
console.log(`🔥 Law Watch API running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

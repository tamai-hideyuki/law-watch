import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createSearchApp } from './presentation/api/search'
import { createLawsApp } from './presentation/api/laws'
import { createMonitoringApp } from './presentation/api/monitoring'
import { MockEGovClient } from './infrastructure/e-gov/mock-e-gov-client'
import { MockWatchListRepository } from './infrastructure/database/mock-watch-list-repository'
import { MockNotificationRepository } from './infrastructure/database/mock-notification-repository'
import { EmailService } from './infrastructure/notification/email-service'
import { SendNotificationUseCase } from './application/usecases/send-notification'

const mockLawRepository = {
  save: async () => {},
  findById: async () => null,
  search: async () => { throw new Error('Use EGovApi for search') }
}

const egovClient = new MockEGovClient()
const mockWatchListRepository = new MockWatchListRepository()
const mockNotificationRepository = new MockNotificationRepository()
const emailService = new EmailService()
const sendNotificationUseCase = new SendNotificationUseCase(emailService)

// メインアプリを作成
const app = new Hono()

// CORS設定
app.use('/*', cors({
  origin: 'http://localhost:3001',
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

// 各エンドポイントアプリを統合
const searchApp = createSearchApp(mockLawRepository, egovClient)
const lawsApp = createLawsApp(mockLawRepository, egovClient)
const monitoringApp = createMonitoringApp(mockWatchListRepository, mockNotificationRepository, egovClient)

app.route('/', searchApp)
app.route('/', lawsApp)
app.route('/', monitoringApp)

const port = 3000
console.log(`🔥 Law Watch API running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

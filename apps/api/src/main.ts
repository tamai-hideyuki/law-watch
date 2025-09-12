import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from '@prisma/client'
import { createSearchApp } from './presentation/api/search'
import { createLawsApp } from './presentation/api/laws'
import { createMonitoringApp } from './presentation/api/monitoring-new'
import comprehensiveMonitoringApp from './presentation/api/comprehensive-monitoring'
import { nationalLawTrackingApp } from './presentation/api/national-law-tracking'
import { MockEGovClient } from './infrastructure/e-gov/mock-e-gov-client'
import { RealEGovClient } from './infrastructure/e-gov/real-e-gov-client'
import { PrismaWatchListRepository } from './infrastructure/database/prisma-watch-list-repository'
import { PrismaNotificationRepository } from './infrastructure/database/prisma-notification-repository'
import { PrismaLawRepository } from './infrastructure/database/prisma-law-repository'
import { PrismaSnapshotRepository } from './infrastructure/database/prisma-snapshot-repository'
import { EmailService } from './infrastructure/notification/email-service'
import { SendNotificationUseCase } from './application/usecases/send-notification'
import { createLogger } from './infrastructure/logging/logger'

// LoggerとPrismaクライアントを初期化
const logger = createLogger('Main')
const prisma = new PrismaClient()

// 環境変数に基づいてe-Gov APIクライアントを選択
const useRealEGovApi = process.env.USE_REAL_E_GOV_API === 'true'
const egovClient = useRealEGovApi ? new RealEGovClient() : new MockEGovClient()

// PrismaRepositoryを使用
const lawRepository = new PrismaLawRepository(prisma)
const watchListRepository = new PrismaWatchListRepository(prisma)
const notificationRepository = new PrismaNotificationRepository(prisma)
const snapshotRepository = new PrismaSnapshotRepository(prisma)
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
const searchApp = createSearchApp(lawRepository, egovClient)
const lawsApp = createLawsApp(lawRepository, egovClient)
const monitoringApp = createMonitoringApp(watchListRepository, lawRepository, notificationRepository, snapshotRepository, egovClient)

app.route('/', searchApp)
app.route('/', lawsApp)
app.route('/', monitoringApp)
app.route('/comprehensive', comprehensiveMonitoringApp)
app.route('/national-tracking', nationalLawTrackingApp)

const port = 3000
logger.info('Law Watch API started', {
  port,
  url: `http://localhost:${port}`,
  database: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/law_watch_dev',
  egovClient: useRealEGovApi ? 'RealEGovClient' : 'MockEGovClient'
})

// グレースフルシャットダウン
process.on('SIGINT', async () => {
  logger.info('Graceful shutdown initiated')
  await prisma.$disconnect()
  process.exit(0)
})

serve({
  fetch: app.fetch,
  port
})

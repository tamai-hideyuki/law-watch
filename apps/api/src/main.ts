import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from '@prisma/client'
import { createSearchApp } from './presentation/api/search'
import { createLawsApp } from './presentation/api/laws'
import { createMonitoringApp } from './presentation/api/monitoring'
import { MockEGovClient } from './infrastructure/e-gov/mock-e-gov-client'
import { PrismaWatchListRepository } from './infrastructure/database/prisma-watch-list-repository'
import { PrismaNotificationRepository } from './infrastructure/database/prisma-notification-repository'
import { PrismaLawRepository } from './infrastructure/database/prisma-law-repository'
import { EmailService } from './infrastructure/notification/email-service'
import { SendNotificationUseCase } from './application/usecases/send-notification'

// Prismaクライアントを初期化
const prisma = new PrismaClient()

// PrismaRepositoryを使用
const lawRepository = new PrismaLawRepository(prisma)
const watchListRepository = new PrismaWatchListRepository(prisma)
const notificationRepository = new PrismaNotificationRepository(prisma)
const egovClient = new MockEGovClient()
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
const monitoringApp = createMonitoringApp(watchListRepository, notificationRepository, egovClient)

app.route('/', searchApp)
app.route('/', lawsApp)
app.route('/', monitoringApp)

const port = 3000
console.log(`🔥 Law Watch API running on http://localhost:${port}`)
console.log(`🗄️  Database: ${process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/law_watch_dev'}`)

// グレースフルシャットダウン
process.on('SIGINT', async () => {
  console.log('🔌 Disconnecting from database...')
  await prisma.$disconnect()
  process.exit(0)
})

serve({
  fetch: app.fetch,
  port
})

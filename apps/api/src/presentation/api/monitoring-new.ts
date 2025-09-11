import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createLogger } from '../../infrastructure/logging/logger'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import type { LawRepository } from '../../application/ports/law-repository'
import type { NotificationRepository } from '../../application/ports/notification-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import { createWatchManagementApp } from './watch-management'
import { createNotificationManagementApp } from './notification-management'

export const createMonitoringApp = (
  watchListRepository: WatchListRepository,
  lawRepository: LawRepository,
  notificationRepository: NotificationRepository,
  egovApi: EGovApi
) => {
  const app = new Hono()
  const logger = createLogger('MonitoringAPI')

  // CORS設定
  app.use('*', cors({
    origin: ['http://localhost:3001'],
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }))

  // エラーハンドリング
  app.onError((err, c) => {
    logger.error('Monitoring API error', { 
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    })
    return c.json({ error: 'Internal server error' }, 500)
  })

  // 監視管理機能
  const watchManagementApp = createWatchManagementApp(watchListRepository, lawRepository, egovApi)
  app.route('/', watchManagementApp)

  // 通知管理機能
  const notificationManagementApp = createNotificationManagementApp(
    watchListRepository,
    notificationRepository,
    egovApi
  )
  app.route('/', notificationManagementApp)

  return app
}
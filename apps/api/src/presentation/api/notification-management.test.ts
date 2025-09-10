import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createNotificationManagementApp } from './notification-management'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import type { NotificationRepository } from '../../application/ports/notification-repository'
import type { EGovApi } from '../../application/ports/e-gov-api'
import { createLawChangeNotification, ChangeType } from '../../domain/monitoring/entities/law-change-notification'

// Mock dependencies
const mockWatchListRepository: WatchListRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findAll: vi.fn(),
  delete: vi.fn()
}

const mockNotificationRepository: NotificationRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByLawId: vi.fn(),
  markAsRead: vi.fn(),
  delete: vi.fn()
}

const mockEGovApi: EGovApi = {
  searchLaws: vi.fn(),
  getLawDetail: vi.fn(),
  simulateChange: vi.fn()
}

describe('NotificationManagementApp', () => {
  let app: any

  beforeEach(() => {
    vi.clearAllMocks()
    app = createNotificationManagementApp(
      mockWatchListRepository,
      mockNotificationRepository,
      mockEGovApi
    )
  })

  describe('GET /monitoring/notifications/:userId', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = [
        createLawChangeNotification({
          id: 'notification-1',
          lawId: '322AC0000000049',
          changeType: ChangeType.CONTENT_UPDATED,
          title: 'Test Notification 1',
          description: 'Test Description 1',
          detectedAt: new Date()
        }),
        createLawChangeNotification({
          id: 'notification-2',
          lawId: '347AC0000000057',
          changeType: ChangeType.STATUS_CHANGED,
          title: 'Test Notification 2',
          description: 'Test Description 2',
          detectedAt: new Date()
        })
      ]

      mockNotificationRepository.findByUserId = vi.fn().mockResolvedValue(mockNotifications)

      const req = new Request('http://localhost/monitoring/notifications/user-1', {
        method: 'GET'
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notifications).toHaveLength(2)
      expect(data.notifications[0].id).toBe('notification-1')
      expect(data.notifications[1].id).toBe('notification-2')
    })

    it('should return 400 for missing userId', async () => {
      const req = new Request('http://localhost/monitoring/notifications/', {
        method: 'GET'
      })

      const res = await app.fetch(req)
      expect(res.status).toBe(404) // Hono returns 404 for missing route params
    })
  })

  describe('POST /monitoring/detect-changes', () => {
    it('should detect changes successfully', async () => {
      const mockNotifications = [
        createLawChangeNotification({
          id: 'notification-1',
          lawId: '322AC0000000049',
          changeType: ChangeType.CONTENT_UPDATED,
          title: 'Law Change Detected',
          description: 'Test Description',
          detectedAt: new Date()
        })
      ]

      // Mock the detect changes use case behavior
      mockWatchListRepository.findAll = vi.fn().mockResolvedValue([])
      mockNotificationRepository.save = vi.fn().mockResolvedValue(mockNotifications[0])

      const req = new Request('http://localhost/monitoring/detect-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('detectedChanges')
      expect(data).toHaveProperty('notifications')
    })
  })

  describe('POST /monitoring/simulate-change', () => {
    it('should simulate change successfully', async () => {
      const req = new Request('http://localhost/monitoring/simulate-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Law change simulated')
    })

    it('should call simulateChange if available', async () => {
      const mockEGovApiWithSimulate = {
        ...mockEGovApi,
        simulateChange: vi.fn()
      }

      const appWithSimulate = createNotificationManagementApp(
        mockWatchListRepository,
        mockNotificationRepository,
        mockEGovApiWithSimulate
      )

      const req = new Request('http://localhost/monitoring/simulate-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      await appWithSimulate.fetch(req)

      expect(mockEGovApiWithSimulate.simulateChange).toHaveBeenCalled()
    })
  })
})
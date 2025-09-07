import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testClient } from 'hono/testing'
import { createMonitoringApp } from './monitoring'


describe('Monitoring API', () => {
  let mockWatchListRepository: any
  let mockNotificationRepository: any
  let mockEGovApi: any
  let monitoringApp: ReturnType<typeof createMonitoringApp>
  let client: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockWatchListRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn()
    }

    mockNotificationRepository = {
      save: vi.fn(),
      findByUserId: vi.fn(),
      markAsRead: vi.fn()
    }

    mockEGovApi = {
      fetchLawDetail: vi.fn(),
      searchLaws: vi.fn()
    }

    monitoringApp = createMonitoringApp(mockWatchListRepository, mockNotificationRepository, mockEGovApi)
    client = testClient(monitoringApp)
  })

  describe('POST /monitoring/watch', () => {
    it('ウォッチリストに法令を追加する', async () => {
      // Arrange
      const existingWatchList = {
        id: 'watch-001',
        userId: 'user-001',
        name: 'マイウォッチリスト',
        lawIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      mockWatchListRepository.findById.mockResolvedValue(existingWatchList)

      // Act
      const response = await client['monitoring']['watch'].$post({
        json: {
          watchListId: 'watch-001',
          lawId: '322AC0000000049'
        }
      })

      // Assert
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.watchList.lawIds).toHaveLength(1)
      expect(mockWatchListRepository.save).toHaveBeenCalled()
    })

    it('存在しないウォッチリストの場合は404を返す', async () => {
      // Arrange
      mockWatchListRepository.findById.mockResolvedValue(null)

      // Act
      const response = await client['monitoring']['watch'].$post({
        json: {
          watchListId: 'nonexistent',
          lawId: '322AC0000000049'
        }
      })

      // Assert
      expect(response.status).toBe(404)
      
      const data = await response.json()
      expect(data.error).toBe('Watch list not found')
    })

    it('watchListIdが未指定の場合は400を返す', async () => {
      // Act
      const response = await client['monitoring']['watch'].$post({
        json: {
          lawId: '322AC0000000049'
        }
      })

      // Assert
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBe('watchListId is required')
    })
    
    describe('POST /monitoring/watch-list', () => {
      it('新しいウォッチリストを作成する', async () => {
        // Act
        const response = await client['monitoring']['watch-list'].$post({
          json: {
            userId: 'user-001',
            name: 'マイウォッチリスト'
          }
        })
    
        // Assert
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.watchList.userId).toBe('user-001')
        expect(data.watchList.name).toBe('マイウォッチリスト')
        expect(data.watchList.id).toBeDefined()
        expect(mockWatchListRepository.save).toHaveBeenCalled()
      })
    
      it('userIdが未指定の場合は400を返す', async () => {
        // Act
        const response = await client['monitoring']['watch-list'].$post({
          json: {
            name: 'テストリスト'
          }
        })
    
        // Assert
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data.error).toBe('userId is required')
      })
    })

    describe('DELETE /monitoring/watch/:watchListId/:lawId', () => {
      it('ウォッチリストから法令を削除する', async () => {
        // Arrange
        const existingWatchList = {
          id: 'watch-001',
          userId: 'user-001',
          name: 'テストリスト',
          lawIds: ['322AC0000000049', '347AC0000000057'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        mockWatchListRepository.findById.mockResolvedValue(existingWatchList)
    
        // Act
        const response = await client['monitoring']['watch']['watch-001']['322AC0000000049'].$delete()
    
        // Assert
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.watchList.lawIds).toHaveLength(1)
        expect(mockWatchListRepository.save).toHaveBeenCalled()
      })
    
      it('存在しないウォッチリストの場合は404を返す', async () => {
        // Arrange
        mockWatchListRepository.findById.mockResolvedValue(null)
    
        // Act
        const response = await client['monitoring']['watch']['watch-001']['322AC0000000049'].$delete()
    
        // Assert
        expect(response.status).toBe(404)
        
        const data = await response.json()
        expect(data.error).toBe('Watch list not found')
      })
    })

    describe('GET /monitoring/notifications/:userId', () => {
      it('ユーザーの通知一覧を取得する', async () => {
        // Arrange
        const mockNotifications = [
          {
            id: 'notification-001',
            lawId: '322AC0000000049',
            changeType: 'content_updated',
            title: '労働基準法の改正',
            description: '第36条が改正されました',
            detectedAt: new Date().toISOString(),
            isRead: false,
            readAt: null
          }
        ]
        
        mockNotificationRepository.findByUserId.mockResolvedValue(mockNotifications)
  
        // Act
        const response = await client['/monitoring/notifications/user-001'].$get()
  
        // Assert
        expect(response.status).toBe(200)
        
        const data = await response.json() as any
        expect(data.success).toBe(true)
        expect(data.notifications).toHaveLength(1)
        expect(data.notifications[0].title).toBe('労働基準法の改正')
      })
    })
  })
    
    describe('POST /monitoring/detect-changes', () => {
      it('変更検知を実行する', async () => {
        // Arrange
        mockWatchListRepository.findAll.mockResolvedValue([])
        
        // Act
        const response = await client['monitoring']['detect-changes'].$post()
    
        // Assert
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(data.success).toBe(true)
      })
    })
})

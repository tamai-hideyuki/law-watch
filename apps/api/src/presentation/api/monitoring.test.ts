import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testClient } from 'hono/testing'
import { createMonitoringApp } from './monitoring'

describe('Monitoring API', () => {
  let mockWatchListRepository: any
  let monitoringApp: ReturnType<typeof createMonitoringApp>
  let client: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockWatchListRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn()
    }

    monitoringApp = createMonitoringApp(mockWatchListRepository)
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
  })
})

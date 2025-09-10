import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createWatchManagementApp } from './watch-management'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'
import { createWatchList } from '../../domain/monitoring/entities/watch-list'
import { createLawId } from '../../domain/law'

// Mock dependencies
const mockWatchListRepository: WatchListRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findAll: vi.fn(),
  delete: vi.fn()
}

describe('WatchManagementApp', () => {
  let app: any

  beforeEach(() => {
    vi.clearAllMocks()
    app = createWatchManagementApp(mockWatchListRepository)
  })

  describe('POST /monitoring/watch', () => {
    it('should add law to watch list successfully', async () => {
      const mockWatchList = {
        ...createWatchList({
          id: 'watch-list-1',
          userId: 'user-1',
          name: 'Test Watch List'
        }),
        lawIds: [createLawId('322AC0000000049')]
      }

      mockWatchListRepository.findById = vi.fn().mockResolvedValue(mockWatchList)
      mockWatchListRepository.save = vi.fn().mockResolvedValue(mockWatchList)

      const req = new Request('http://localhost/monitoring/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchListId: 'watch-list-1',
          lawId: '322AC0000000049'
        })
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.watchList).toBeDefined()
      expect(data.watchList.id).toBe('watch-list-1')
    })

    it('should return 400 for missing watchListId', async () => {
      const req = new Request('http://localhost/monitoring/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawId: '322AC0000000049'
        })
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('watchListId is required')
    })

    it('should return 400 for missing lawId', async () => {
      const req = new Request('http://localhost/monitoring/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchListId: 'watch-list-1'
        })
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('lawId is required')
    })
  })

  describe('GET /monitoring/watch/:userId', () => {
    it('should get user watch lists successfully', async () => {
      const mockWatchLists = [
        createWatchList({
          id: 'watch-list-1',
          userId: 'user-1',
          name: 'Test Watch List 1'
        }),
        createWatchList({
          id: 'watch-list-2',
          userId: 'user-1',
          name: 'Test Watch List 2'
        })
      ]

      mockWatchListRepository.findByUserId = vi.fn().mockResolvedValue(mockWatchLists)

      const req = new Request('http://localhost/monitoring/watch/user-1', {
        method: 'GET'
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.watchLists).toHaveLength(2)
      expect(data.watchLists[0].id).toBe('watch-list-1')
      expect(data.watchLists[1].id).toBe('watch-list-2')
    })
  })

  describe('POST /monitoring/watch-list', () => {
    it('should create watch list successfully', async () => {
      const mockWatchList = createWatchList({
        id: 'watch-list-1',
        userId: 'user-1',
        name: 'New Watch List'
      })

      mockWatchListRepository.save = vi.fn().mockResolvedValue(mockWatchList)

      const req = new Request('http://localhost/monitoring/watch-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-1',
          name: 'New Watch List'
        })
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.watchList).toBeDefined()
    })

    it('should return 400 for missing userId', async () => {
      const req = new Request('http://localhost/monitoring/watch-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Watch List'
        })
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('userId is required')
    })
  })

  describe('DELETE /monitoring/watch/:watchListId/:lawId', () => {
    it('should remove law from watch list successfully', async () => {
      const mockWatchList = createWatchList({
        id: 'watch-list-1',
        userId: 'user-1',
        name: 'Test Watch List'
      })

      mockWatchListRepository.findById = vi.fn().mockResolvedValue(mockWatchList)
      mockWatchListRepository.save = vi.fn().mockResolvedValue(mockWatchList)

      const req = new Request('http://localhost/monitoring/watch/watch-list-1/322AC0000000049', {
        method: 'DELETE'
      })

      const res = await app.fetch(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.watchList).toBeDefined()
    })
  })
})
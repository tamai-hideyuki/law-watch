import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testClient } from 'hono/testing'
import { createSearchApp } from './search'

describe('Search API', () => {
  let mockLawRepository: any
  let mockEGovApi: any
  let searchApp: ReturnType<typeof createSearchApp>

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockLawRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      search: vi.fn()
    }

    mockEGovApi = {
      searchLaws: vi.fn(),
      getLawDetail: vi.fn()
    }

    searchApp = createSearchApp(mockLawRepository, mockEGovApi)
  })

  describe('GET /search', () => {
    it('HTTPリクエストを受け取り、ビジネスロジックを実行し、HTTPレスポンスを返す', async () => {
      const mockApiResponse = {
        laws: [{
          id: '322AC0000000049',
          name: '労働基準法',
          number: '昭和二十二年法律第四十九号',
          promulgationDate: '1947-04-07',
          category: '憲法・法律',
          status: '施行中'
        }],
        totalCount: 1
      }
      mockEGovApi.searchLaws.mockResolvedValue(mockApiResponse)

      const client = testClient(searchApp) as ReturnType<typeof testClient>

      const response = await client.search.$get({
        query: { q: '労働' }
      })

      expect(response.status).toBe(200)
      
      const data = await response.json() as any

      expect(data).toEqual({
        query: '労働',
        totalCount: 1,
        laws: expect.arrayContaining([
          expect.objectContaining({
            name: '労働基準法',
            id: '322AC0000000049'
          })
        ]),
        executedAt: expect.any(String)
      })

      expect(new Date(data.executedAt)).toBeInstanceOf(Date)
      expect(new Date(data.executedAt).getTime()).not.toBeNaN()

      expect(mockEGovApi.searchLaws).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: '労働' })
      )
    })

    it('クエリパラメータが空の場合は400エラーを返す', async () => {
      const client = testClient(searchApp) as ReturnType<typeof testClient>

      const response = await client.search.$get({
        query: { q: '' }
      })

      expect(response.status).toBe(400)
      
      const data = await response.json() as any

      expect(data).toEqual({
        error: 'Query parameter is required'
      })

      expect(mockEGovApi.searchLaws).not.toHaveBeenCalled()
    })

    it('クエリパラメータが存在しない場合は400エラーを返す', async () => {
      const client = testClient(searchApp) as ReturnType<typeof testClient>

      const response = await client.search.$get({
        query: {}
      })

      expect(response.status).toBe(400)
      
      const data = await response.json() as any

      expect(data).toEqual({
        error: 'Query parameter is required'
      })

      expect(mockEGovApi.searchLaws).not.toHaveBeenCalled()
    })

    it('ビジネスロジックでエラーが発生した場合は500エラーを返す', async () => {
      mockEGovApi.searchLaws.mockRejectedValue(new Error('API Error'))
      const client = testClient(searchApp) as ReturnType<typeof testClient>

      const response = await client.search.$get({
        query: { q: '労働' }
      })

      expect(response.status).toBe(500)
      
      const data = await response.json() as any

      expect(data).toEqual({
        error: 'Internal server error'
      })
    })

    it('検索結果が空の場合も正常にレスポンスを返す', async () => {
      mockEGovApi.searchLaws.mockResolvedValue({ laws: [], totalCount: 0 })
      const client = testClient(searchApp) as ReturnType<typeof testClient>

      const response = await client.search.$get({
        query: { q: '存在しない法律' }
      })

      expect(response.status).toBe(200)
      
      const data = await response.json() as any

      expect(data).toEqual({
        query: '存在しない法律',
        totalCount: 0,
        laws: [],
        executedAt: expect.any(String)
      })

      expect(new Date(data.executedAt)).toBeInstanceOf(Date)
      expect(new Date(data.executedAt).getTime()).not.toBeNaN()
    })
  })
})

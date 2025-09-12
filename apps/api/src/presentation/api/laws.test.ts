import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testClient } from 'hono/testing'
import { createLawsApp } from './laws'

describe('Laws API', () => {
    let mockLawRepository: any
    let mockEGovApi: any
    let lawsApp: ReturnType<typeof createLawsApp>
    let client: any 

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockLawRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      search: vi.fn(),
      findAll: vi.fn()
    }

    mockEGovApi = {
      searchLaws: vi.fn(),
      getLawDetail: vi.fn()
    }

    lawsApp = createLawsApp(mockLawRepository, mockEGovApi)
    client = testClient(lawsApp)
  })

  describe('GET /laws', () => {
    it('監視対象法令一覧を取得して返す', async () => {
      // Arrange - 監視対象として登録されている法令のみをモック
      const mockMonitoredLaws = [
        {
          id: '322AC0000000049',
          name: '労働基準法',
          number: '昭和二十二年法律第四十九号',
          promulgationDate: new Date('1947-04-07'),
          category: '憲法・法律',
          status: '施行中'
        }
      ]
      mockLawRepository.findAll.mockResolvedValue(mockMonitoredLaws)

      // Act
      const response = await client.laws.$get()

      // Assert
      expect(response.status).toBe(200)
      
      const data = await response.json() as any
      expect(data.totalCount).toBe(1)
      expect(data.laws).toHaveLength(1)
      expect(data.laws[0].name).toBe('労働基準法')
      expect(data.laws[0].id).toBe('322AC0000000049')
      expect(data.executedAt).toBeDefined()
      
      // findAllが呼ばれることを確認
      expect(mockLawRepository.findAll).toHaveBeenCalledOnce()
    })

    it('エラーが発生した場合は500を返す', async () => {
      // Arrange
      mockLawRepository.findAll.mockRejectedValue(new Error('Database Error'))

      // Act
      const response = await client.laws.$get()

      // Assert
      expect(response.status).toBe(500)
      
      const data = await response.json() as any
      expect(data.error).toBe('Internal server error')
    })
  })
})

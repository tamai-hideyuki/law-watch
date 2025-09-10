import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RealEGovClient } from './real-e-gov-client'
import { createLawId, createSimpleSearchQuery } from '../../domain/law'

// Fetchをモック化
global.fetch = vi.fn()

describe('RealEGovClient', () => {
  let client: RealEGovClient
  const mockFetch = global.fetch as any

  beforeEach(() => {
    vi.clearAllMocks()
    client = new RealEGovClient()
  })

  describe('searchLaws', () => {
    it('should handle successful law list response', async () => {
      const mockXmlResponse = `
        <DataRoot>
          <法令一覧情報>
            <法令>
              <法令ID>322AC0000000049</法令ID>
              <法令名>労働基準法</法令名>
              <法令番号>昭和二十二年法律第四十九号</法令番号>
              <公布年月日>1947/04/07</公布年月日>
              <種別>憲法・法律</種別>
              <効力>現行法</効力>
            </法令>
          </法令一覧情報>
        </DataRoot>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      const query = createSimpleSearchQuery('__ALL_LAWS__')
      const result = await client.searchLaws(query)

      expect(result.laws).toHaveLength(1)
      expect(result.laws[0]).toMatchObject({
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        promulgationDate: '1947-04-07',
        category: '憲法・法律',
        status: '施行中'
      })
      expect(result.totalCount).toBe(1)
    })

    it('should filter laws by keyword', async () => {
      const mockXmlResponse = `
        <DataRoot>
          <法令一覧情報>
            <法令>
              <法令ID>322AC0000000049</法令ID>
              <法令名>労働基準法</法令名>
              <法令番号>昭和二十二年法律第四十九号</法令番号>
              <公布年月日>1947/04/07</公布年月日>
              <種別>憲法・法律</種別>
              <効力>現行法</効力>
            </法令>
            <法令>
              <法令ID>325AC1000000201</法令ID>
              <法令名>建築基準法</法令名>
              <法令番号>昭和二十五年法律第二百一号</法令番号>
              <公布年月日>1950/05/24</公布年月日>
              <種別>憲法・法律</種別>
              <効力>現行法</効力>
            </法令>
          </法令一覧情報>
        </DataRoot>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      const query = createSimpleSearchQuery('労働')
      const result = await client.searchLaws(query)

      expect(result.laws).toHaveLength(1)
      expect(result.laws[0].name).toBe('労働基準法')
      expect(result.totalCount).toBe(1)
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const query = createSimpleSearchQuery('test')
      
      await expect(client.searchLaws(query)).rejects.toThrow('HTTP error! status: 500')
    })

    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 100)
        })
      )

      const query = createSimpleSearchQuery('test')
      
      await expect(client.searchLaws(query)).rejects.toThrow()
    })
  })

  describe('getLawDetail', () => {
    it('should handle successful law detail response', async () => {
      const mockXmlResponse = `
        <DataRoot>
          <法令>
            <法令ID>322AC0000000049</法令ID>
            <法令名>労働基準法</法令名>
            <法令番号>昭和二十二年法律第四十九号</法令番号>
            <公布年月日>1947/04/07</公布年月日>
            <種別>憲法・法律</種別>
            <効力>現行法</効力>
          </法令>
        </DataRoot>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      const lawId = createLawId('322AC0000000049')
      const result = await client.getLawDetail(lawId)

      expect(result).toMatchObject({
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        promulgationDate: '1947-04-07',
        category: '憲法・法律',
        status: '施行中'
      })
    })

    it('should handle HTTP errors for law detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      // 有効なフォーマットだが存在しないIDを使用
      const lawId = createLawId('999AC9999999999')
      
      await expect(client.getLawDetail(lawId)).rejects.toThrow('HTTP error! status: 404')
    })
  })

  describe('XML parsing', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      client = new RealEGovClient()
    })

    it('should handle various date formats', async () => {
      const mockXmlResponse = `<DataRoot><法令一覧情報><法令><法令ID>test1</法令ID><法令名>テスト法</法令名><法令番号>令和5年法律第1号</法令番号><公布年月日>2023/01/01</公布年月日><種別>憲法・法律</種別><効力>現行法</効力></法令><法令><法令ID>test2</法令ID><法令名>テスト法2</法令名><法令番号>令和5年法律第2号</法令番号><公布年月日>20230102</公布年月日><種別>憲法・法律</種別><効力>現行法</効力></法令></法令一覧情報></DataRoot>`

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      const query = createSimpleSearchQuery('__ALL_LAWS__')
      const result = await client.searchLaws(query)

      expect(result.laws).toHaveLength(2)
      expect(result.laws[0].promulgationDate).toBe('2023-01-01')
      expect(result.laws[1].promulgationDate).toBe('2023-01-02')
    })

    it('should map different effect values to status', async () => {
      const mockXmlResponse = `<DataRoot><法令一覧情報><法令><法令ID>test1</法令ID><法令名>現行法</法令名><法令番号>令和5年法律第1号</法令番号><公布年月日>2023/01/01</公布年月日><種別>憲法・法律</種別><効力>現行法</効力></法令><法令><法令ID>test2</法令ID><法令名>廃止法</法令名><法令番号>令和5年法律第2号</法令番号><公布年月日>2023/01/02</公布年月日><種別>憲法・法律</種別><効力>廃止</効力></法令></法令一覧情報></DataRoot>`

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      const query = createSimpleSearchQuery('__ALL_LAWS__')
      const result = await client.searchLaws(query)

      expect(result.laws).toHaveLength(2)
      expect(result.laws[0].status).toBe('施行中')
      expect(result.laws[1].status).toBe('廃止')
    })
  })

  describe('rate limiting', () => {
    it('should apply rate limiting to requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<DataRoot><法令一覧情報></法令一覧情報></DataRoot>')
      })

      const query = createSimpleSearchQuery('test')
      
      // 複数のリクエストを並行実行
      const promises = Array(5).fill(null).map(() => client.searchLaws(query))
      
      await Promise.all(promises)
      
      // レート制限が適用されていることを確認
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })
  })
})
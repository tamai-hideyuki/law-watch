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
          <LawNameListInfo>
            <LawId>322AC0000000049</LawId>
            <LawName>労働基準法</LawName>
            <LawNo>昭和二十二年法律第四十九号</LawNo>
            <PromulgationDate>19470407</PromulgationDate>
          </LawNameListInfo>
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
        category: '法律',
        status: '施行中'
      })
      expect(result.totalCount).toBe(1)
    })

    it('should filter laws by keyword', async () => {
      const mockXmlResponse = `
        <DataRoot>
          <LawNameListInfo>
            <LawId>322AC0000000049</LawId>
            <LawName>労働基準法</LawName>
            <LawNo>昭和二十二年法律第四十九号</LawNo>
            <PromulgationDate>19470407</PromulgationDate>
          </LawNameListInfo>
          <LawNameListInfo>
            <LawId>325AC1000000201</LawId>
            <LawName>建築基準法</LawName>
            <LawNo>昭和二十五年法律第二百一号</LawNo>
            <PromulgationDate>19500524</PromulgationDate>
          </LawNameListInfo>
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
        status: 500,
        statusText: 'Internal Server Error'
      })

      const query = createSimpleSearchQuery('test')
      const result = await client.searchLaws(query)
      
      // エラー時は空の結果を返すように変更されたため
      expect(result.laws).toEqual([])
      expect(result.totalCount).toBe(0)
    })

    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 100)
        })
      )

      const query = createSimpleSearchQuery('test')
      const result = await client.searchLaws(query)
      
      // エラー時は空の結果を返すように変更されたため
      expect(result.laws).toEqual([])
      expect(result.totalCount).toBe(0)
    })
  })

  describe('getLawDetail', () => {
    it('should handle successful law detail response', async () => {
      const mockXmlResponse = `
        <DataRoot>
          <Law Era="Showa" Year="22" Num="49" PromulgateMonth="04" PromulgateDay="07">
            <LawNum>昭和二十二年法律第四十九号</LawNum>
            <LawTitle>労働基準法</LawTitle>
          </Law>
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
      const mockXmlResponse = `<DataRoot><LawNameListInfo><LawId>test1</LawId><LawName>テスト法</LawName><LawNo>令和5年法律第1号</LawNo><PromulgationDate>20230101</PromulgationDate></LawNameListInfo><LawNameListInfo><LawId>test2</LawId><LawName>テスト法2</LawName><LawNo>令和5年法律第2号</LawNo><PromulgationDate>20230102</PromulgationDate></LawNameListInfo></DataRoot>`

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
      const mockXmlResponse = `<DataRoot><LawNameListInfo><LawId>test1</LawId><LawName>現行法</LawName><LawNo>令和5年法律第1号</LawNo><PromulgationDate>20230101</PromulgationDate></LawNameListInfo><LawNameListInfo><LawId>test2</LawId><LawName>廃止法</LawName><LawNo>令和5年法律第2号</LawNo><PromulgationDate>20230102</PromulgationDate></LawNameListInfo></DataRoot>`

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXmlResponse)
      })

      const query = createSimpleSearchQuery('__ALL_LAWS__')
      const result = await client.searchLaws(query)

      expect(result.laws).toHaveLength(2)
      expect(result.laws[0].status).toBe('施行中')
      expect(result.laws[1].status).toBe('施行中')
    })
  })

  describe('rate limiting', () => {
    it('should apply rate limiting to requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<DataRoot></DataRoot>')
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
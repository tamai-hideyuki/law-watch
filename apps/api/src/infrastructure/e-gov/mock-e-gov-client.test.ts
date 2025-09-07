import { describe, it, expect, beforeEach } from 'vitest'
import { MockEGovClient } from './mock-e-gov-client'
import { createSimpleSearchQuery } from '../../domain/law'

describe('MockEGovClient', () => {
  let client: MockEGovClient

  beforeEach(() => {
    client = new MockEGovClient()
  })

  describe('searchLaws', () => {
    it('労働に関する検索で関連法令を返す', async () => {
      const query = createSimpleSearchQuery('労働')

      const result = await client.searchLaws(query)

      expect(result.totalCount).toBe(3)
      expect(result.laws).toHaveLength(3)
      expect(result.laws[0].name).toBe('労働基準法')
      expect(result.laws[1].name).toBe('労働安全衛生法')
      expect(result.laws[2].name).toBe('労働者派遣事業の適正な運営の確保及び派遣労働者の保護等に関する法律')
    })

    it('該当しないキーワードで空の結果を返す', async () => {
      const query = createSimpleSearchQuery('存在しないキーワード')

      const result = await client.searchLaws(query)

      expect(result.totalCount).toBe(0)
      expect(result.laws).toHaveLength(0)
    })

    it('APIらしい遅延がある', async () => {
      const query = createSimpleSearchQuery('労働')
      const startTime = Date.now()

      await client.searchLaws(query)

      const endTime = Date.now()
      expect(endTime - startTime).toBeGreaterThanOrEqual(100)
    })
  })

  describe('getLawDetail', () => {
    it('未実装エラーを投げる', async () => {
      await expect(client.getLawDetail('test' as any)).rejects.toThrow('Not implemented yet')
    })
  })
})

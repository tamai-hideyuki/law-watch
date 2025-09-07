import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchLawsUseCase } from './search-laws'
import { createSimpleSearchQuery, createEmptySearchResult } from '../../domain/law'
import type { LawRepository } from '../ports/law-repository'
import type { EGovApi } from '../ports/e-gov-api'

describe('SearchLawsUseCase', () => {
  let mockLawRepository: LawRepository
  let mockEGovApi: EGovApi
  let useCase: SearchLawsUseCase

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

    useCase = new SearchLawsUseCase(mockLawRepository, mockEGovApi)
  })

  it('法律をうまく検索する', async () => {
    const query = createSimpleSearchQuery('労働')
    const mockApiResponse = {
      laws: [
        {
          id: '322AC0000000049',
          name: '労働基準法',
          number: '昭和二十二年法律第四十九号',
          promulgationDate: new Date('1947-04-07'),
          category: '憲法・法律',
          status: '施行中'
        }
      ],
      totalCount: 1
    }

    mockEGovApi.searchLaws.mockResolvedValue(mockApiResponse)

    // Act
    const result = await useCase.execute(query)

    // Assert
    expect(result.totalCount).toBe(1)           // 件数確認
    expect(result.laws).toHaveLength(1)         // 配列長確認  
    expect(result.laws[0].name).toBe('労働基準法') // 内容確認
    expect(mockEGovApi.searchLaws).toHaveBeenCalledWith(query) // 呼び出し確認
  })

  it('法律が見つからない場合は空の結果を返す', async () => {
    // Arrange
    const query = createSimpleSearchQuery('存在しない法律')
    mockEGovApi.searchLaws.mockResolvedValue({ laws: [], totalCount: 0 })

    // Act
    const result = await useCase.execute(query)

    // Assert
    expect(result.totalCount).toBe(0)
    expect(result.laws).toHaveLength(0)
  })

  it('APIエラーを適切に処理する', async () => {
    // Arrange
    const query = createSimpleSearchQuery('労働')
    mockEGovApi.searchLaws.mockRejectedValue(new Error('API Error'))

    // Act & Assert
    await expect(useCase.execute(query)).rejects.toThrow('Failed to search laws')
  })
})

//メモ

//toStrictEqual を使うべきケース：
//
//オブジェクト全体の構造検証が重要
//プロパティの順序や型まで厳密に検証したい
//複雑なネストしたオブジェクトの比較

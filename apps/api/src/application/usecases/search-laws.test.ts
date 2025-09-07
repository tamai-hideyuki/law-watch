import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedFunction } from 'vitest'
import { SearchLawsUseCase } from './search-laws'
import { createSimpleSearchQuery } from '../../domain/law'
import type { LawRepository } from '../ports/law-repository'
import type { EGovApi } from '../ports/e-gov-api'

describe('SearchLawsUseCase', () => {
  let mockLawRepository: {
    save: MockedFunction<LawRepository['save']>
    findById: MockedFunction<LawRepository['findById']>
    search: MockedFunction<LawRepository['search']>
  }
  let mockEGovApi: {
    searchLaws: MockedFunction<EGovApi['searchLaws']>
    getLawDetail: MockedFunction<EGovApi['getLawDetail']>
  }
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

  it('法律を検索できる', async () => {
    const query = createSimpleSearchQuery('労働')
    const mockResponse = {
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

    mockEGovApi.searchLaws.mockResolvedValue(mockResponse)

    const result = await useCase.execute(query)

    expect(result).toEqual(expect.objectContaining({
      laws: expect.arrayContaining([expect.objectContaining({ name: '労働基準法' })]),
      totalCount: 1,
      query
    }))
    expect(result.executedAt).toBeInstanceOf(Date)
    expect(mockEGovApi.searchLaws).toHaveBeenCalledWith(query)
  })

  it('法律が見つからない場合は空の結果を返す', async () => {
    const query = createSimpleSearchQuery('存在しない法律')
    mockEGovApi.searchLaws.mockResolvedValue({ laws: [], totalCount: 0 })

    const result = await useCase.execute(query)

    expect(result).toEqual(expect.objectContaining({
      laws: [],
      totalCount: 0,
      query
    }))
    expect(result.executedAt).toBeInstanceOf(Date)
  })

  it('APIエラーを適切に処理する', async () => {
    const query = createSimpleSearchQuery('労働')
    mockEGovApi.searchLaws.mockRejectedValue(new Error('API Error'))

    await expect(useCase.execute(query)).rejects.toThrow('API Error')
  })
})

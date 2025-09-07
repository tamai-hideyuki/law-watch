import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AddLawToWatchListUseCase } from './add-law-to-watch-list'
import { createLawId } from '../../domain/law'
import type { WatchListRepository } from '../../application/ports/watch-list-repository'

describe('AddLawToWatchListUseCase', () => {
  let mockSave: any
  let mockFindById: any
  let mockFindByUserId: any
  let mockWatchListRepository: WatchListRepository
  let useCase: AddLawToWatchListUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSave = vi.fn()
    mockFindById = vi.fn()
    mockFindByUserId = vi.fn()
    
    mockWatchListRepository = {
      save: mockSave,
      findById: mockFindById,
      findByUserId: mockFindByUserId
    }

    useCase = new AddLawToWatchListUseCase(mockWatchListRepository)
  })

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
    
    mockFindById.mockResolvedValue(existingWatchList)
    const lawId = createLawId('322AC0000000049')

    // Act
    const result = await useCase.execute('watch-001', lawId)

    // Assert
    expect(result.lawIds).toHaveLength(1)
    expect(result.lawIds[0]).toBe(lawId)
    expect(mockSave).toHaveBeenCalledWith(result)
  })

  it('存在しないウォッチリストの場合はエラーを投げる', async () => {
    // Arrange
    mockFindById.mockResolvedValue(null)
    const lawId = createLawId('322AC0000000049')

    // Act & Assert
    await expect(useCase.execute('watch-001', lawId))
      .rejects.toThrow('Watch list not found')
  })
})

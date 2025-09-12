import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RemoveLawFromWatchListUseCase } from './remove-law-from-watch-list'
import { createLawId } from '../../domain/law'
import type { WatchListRepository } from '../ports/watch-list-repository'

describe('RemoveLawFromWatchListUseCase', () => {
  let mockSave: any
  let mockFindById: any
  let mockFindByUserId: any
  let mockWatchListRepository: WatchListRepository
  let useCase: RemoveLawFromWatchListUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSave = vi.fn()
    mockFindById = vi.fn()
    mockFindByUserId = vi.fn()
    
    mockWatchListRepository = {
      save: mockSave,
      findById: mockFindById,
      findByUserId: mockFindByUserId,
      findAll: vi.fn()
    }

    useCase = new RemoveLawFromWatchListUseCase(mockWatchListRepository)
  })

  it('ウォッチリストから法令を削除する', async () => {
    // Arrange
    const lawIdToRemove = createLawId('322AC0000000049')
    const remainingLawId = createLawId('347AC0000000057')
    
    const existingWatchList = {
      id: 'watch-001',
      userId: 'user-001',
      name: 'テストリスト',
      lawIds: [lawIdToRemove, remainingLawId],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockFindById.mockResolvedValue(existingWatchList)

    // Act
    const result = await useCase.execute('watch-001', lawIdToRemove)

    // Assert
    expect(result.lawIds).toHaveLength(1)
    expect(result.lawIds[0]).toBe(remainingLawId)
    expect(mockSave).toHaveBeenCalledWith(result)
  })

  it('存在しないウォッチリストの場合はエラーを投げる', async () => {
    // Arrange
    mockFindById.mockResolvedValue(null)
    const lawId = createLawId('322AC0000000049')

    // Act & Assert
    await expect(useCase.execute('nonexistent', lawId))
      .rejects.toThrow('Watch list not found')
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateWatchListUseCase } from './create-watch-list'
import type { WatchListRepository } from '../ports/watch-list-repository'

describe('CreateWatchListUseCase', () => {
  let mockSave: any
  let mockFindById: any
  let mockFindByUserId: any
  let mockWatchListRepository: WatchListRepository
  let useCase: CreateWatchListUseCase

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

    useCase = new CreateWatchListUseCase(mockWatchListRepository)
  })

  it('新しいウォッチリストを作成する', async () => {
    // Act
    const result = await useCase.execute('user-001', 'マイウォッチリスト')

    // Assert
    expect(result.userId).toBe('user-001')
    expect(result.name).toBe('マイウォッチリスト')
    expect(result.lawIds).toHaveLength(0)
    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(mockSave).toHaveBeenCalledWith(result)
  })

  it('空の名前の場合はエラーを投げる', async () => {
    // Act & Assert
    await expect(useCase.execute('user-001', ''))
      .rejects.toThrow('Watch list name cannot be empty')
  })

  it('空のユーザーIDの場合はエラーを投げる', async () => {
    // Act & Assert
    await expect(useCase.execute('', 'テストリスト'))
      .rejects.toThrow('User ID cannot be empty')
  })
})

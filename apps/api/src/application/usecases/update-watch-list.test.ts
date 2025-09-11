import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateWatchListUseCase } from './update-watch-list'
import { MockWatchListRepository } from '../../infrastructure/database/mock-watch-list-repository'
import type { WatchList } from '../../domain/monitoring/entities/watch-list'

describe('UpdateWatchListUseCase', () => {
  let useCase: UpdateWatchListUseCase
  let mockRepository: MockWatchListRepository
  let testWatchList: WatchList

  beforeEach(() => {
    mockRepository = new MockWatchListRepository()
    useCase = new UpdateWatchListUseCase(mockRepository)
    
    testWatchList = {
      id: 'watch-list-1',
      userId: 'user-001',
      name: 'Original Name',
      lawIds: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
    
    mockRepository.save(testWatchList)
  })

  describe('正常系', () => {
    it('監視リスト名を正常に更新できる', async () => {
      const result = await useCase.execute('watch-list-1', 'user-001', 'Updated Name')
      
      expect(result.success).toBe(true)
      
      const updatedWatchList = await mockRepository.findById('watch-list-1')
      expect(updatedWatchList?.name).toBe('Updated Name')
      expect(updatedWatchList?.updatedAt).not.toEqual(testWatchList.updatedAt)
    })

    it('名前の前後の空白が自動的に除去される', async () => {
      const result = await useCase.execute('watch-list-1', 'user-001', '  Trimmed Name  ')
      
      expect(result.success).toBe(true)
      
      const updatedWatchList = await mockRepository.findById('watch-list-1')
      expect(updatedWatchList?.name).toBe('Trimmed Name')
    })

    it('100文字の名前を正常に設定できる', async () => {
      const longName = 'a'.repeat(100)
      const result = await useCase.execute('watch-list-1', 'user-001', longName)
      
      expect(result.success).toBe(true)
      
      const updatedWatchList = await mockRepository.findById('watch-list-1')
      expect(updatedWatchList?.name).toBe(longName)
    })
  })

  describe('異常系', () => {
    it('存在しない監視リストIDの場合はエラーを返す', async () => {
      const result = await useCase.execute('non-existent', 'user-001', 'New Name')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Watch list not found')
    })

    it('所有者以外のユーザーの場合はエラーを返す', async () => {
      const result = await useCase.execute('watch-list-1', 'different-user', 'New Name')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: Watch list does not belong to user')
    })

    it('空文字列の名前の場合はエラーを返す', async () => {
      const result = await useCase.execute('watch-list-1', 'user-001', '')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Watch list name cannot be empty')
    })

    it('空白のみの名前の場合はエラーを返す', async () => {
      const result = await useCase.execute('watch-list-1', 'user-001', '   ')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Watch list name cannot be empty')
    })

    it('101文字の名前の場合はエラーを返す', async () => {
      const tooLongName = 'a'.repeat(101)
      const result = await useCase.execute('watch-list-1', 'user-001', tooLongName)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Watch list name must be 100 characters or less')
    })

    it('名前が文字列でない場合はエラーを返す', async () => {
      const result = await useCase.execute('watch-list-1', 'user-001', null as any)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Watch list name is required')
    })

    it('制御文字を含む名前の場合はエラーを返す', async () => {
      const invalidName = 'Test\x00Name'
      const result = await useCase.execute('watch-list-1', 'user-001', invalidName)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Watch list name contains invalid characters')
    })
  })

  describe('リポジトリエラー', () => {
    it('リポジトリでエラーが発生した場合は適切にハンドリングされる', async () => {
      // findByIdでエラーを発生させる
      mockRepository.findById = async () => {
        throw new Error('Database connection failed')
      }
      
      const result = await useCase.execute('watch-list-1', 'user-001', 'New Name')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update watch list name')
    })
  })
})
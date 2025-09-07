import { describe, it, expect, beforeEach } from 'vitest'
import { MockWatchListRepository } from './mock-watch-list-repository'
import { createWatchList } from '../../domain/monitoring/entities/watch-list'

describe('MockWatchListRepository', () => {
  let repository: MockWatchListRepository

  beforeEach(() => {
    repository = new MockWatchListRepository()
  })

  describe('save', () => {
    it('新しいウォッチリストを保存する', async () => {
      // Arrange
      const watchList = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'テストリスト'
      })

      // Act
      await repository.save(watchList)
      const result = await repository.findById('watch-001')

      // Assert
      expect(result).toEqual(watchList)
    })

    it('既存のウォッチリストを更新する', async () => {
      // Arrange
      const watchList = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'テストリスト'
      })
      await repository.save(watchList)

      const updatedWatchList = { ...watchList, name: '更新されたリスト' }

      // Act
      await repository.save(updatedWatchList)
      const result = await repository.findById('watch-001')

      // Assert
      expect(result?.name).toBe('更新されたリスト')
    })
  })

  describe('findById', () => {
    it('存在しないIDの場合はnullを返す', async () => {
      // Act
      const result = await repository.findById('nonexistent')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('指定ユーザーのウォッチリストのみを返す', async () => {
      // Arrange
      const watchList1 = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'ユーザー1のリスト'
      })
      const watchList2 = createWatchList({
        id: 'watch-002',
        userId: 'user-002',
        name: 'ユーザー2のリスト'
      })
      
      await repository.save(watchList1)
      await repository.save(watchList2)

      // Act
      const result = await repository.findByUserId('user-001')

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('user-001')
    })
  })
})

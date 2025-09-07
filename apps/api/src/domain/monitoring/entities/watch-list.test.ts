import { describe, it, expect } from 'vitest'
import { createWatchList, addLawToWatchList, removeLawFromWatchList } from './watch-list'
import { createLawId } from '../../law'

describe('WatchList', () => {
  describe('createWatchList', () => {
    it('空のウォッチリストを作成する', () => {
      // Arrange & Act
      const watchList = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'マイウォッチリスト'
      })

      // Assert
      expect(watchList.id).toBe('watch-001')
      expect(watchList.userId).toBe('user-001')
      expect(watchList.name).toBe('マイウォッチリスト')
      expect(watchList.lawIds).toHaveLength(0)
      expect(watchList.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('addLawToWatchList', () => {
    it('ウォッチリストに法令を追加する', () => {
      // Arrange
      const watchList = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'マイウォッチリスト'
      })
      const lawId = createLawId('322AC0000000049')

      // Act
      const updatedWatchList = addLawToWatchList(watchList, lawId)

      // Assert
      expect(updatedWatchList.lawIds).toHaveLength(1)
      expect(updatedWatchList.lawIds[0]).toBe(lawId)
    })

    it('重複する法令は追加しない', () => {
      // Arrange
      const lawId = createLawId('322AC0000000049')
      const watchList = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'マイウォッチリスト'
      })
      const watchListWithLaw = addLawToWatchList(watchList, lawId)

      // Act
      const result = addLawToWatchList(watchListWithLaw, lawId)

      // Assert
      expect(result.lawIds).toHaveLength(1)
    })
  })

  describe('removeLawFromWatchList', () => {
    it('ウォッチリストから法令を削除する', async () => {
      // Arrange
      const lawId1 = createLawId('322AC0000000049')
      const lawId2 = createLawId('347AC0000000057')
      const watchList = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'テストリスト'
      })
      const watchListWithLaws = addLawToWatchList(
        addLawToWatchList(watchList, lawId1), 
        lawId2
      )
    
      // 少し待機して時刻を確実に変える
      await new Promise(resolve => setTimeout(resolve, 1))
    
      // Act
      const result = removeLawFromWatchList(watchListWithLaws, lawId1)
    
      // Assert
      expect(result.lawIds).toHaveLength(1)
      expect(result.lawIds[0]).toBe(lawId2)
      expect(result.updatedAt.getTime()).toBeGreaterThan(watchListWithLaws.updatedAt.getTime())
    })
  
    it('存在しない法令の削除は何もしない', () => {
      // Arrange
      const lawId1 = createLawId('322AC0000000049')
      const nonExistentLawId = createLawId('999999999')
      const watchList = createWatchList({
        id: 'watch-001',
        userId: 'user-001',
        name: 'テストリスト'
      })
      const watchListWithLaw = addLawToWatchList(watchList, lawId1)
  
      // Act
      const result = removeLawFromWatchList(watchListWithLaw, nonExistentLawId)
  
      // Assert
      expect(result.lawIds).toHaveLength(1)
      expect(result.lawIds[0]).toBe(lawId1)
    })
  })
})

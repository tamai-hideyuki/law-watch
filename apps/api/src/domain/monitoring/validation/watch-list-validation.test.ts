import { describe, it, expect } from 'vitest'
import { validateWatchListName } from './watch-list-validation'

describe('validateWatchListName', () => {
  describe('正常系', () => {
    it('有効な名前の場合はtrueを返す', () => {
      const result = validateWatchListName('Valid Watch List Name')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBe('')
    })

    it('1文字の名前の場合はtrueを返す', () => {
      const result = validateWatchListName('A')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBe('')
    })

    it('100文字の名前の場合はtrueを返す', () => {
      const longName = 'a'.repeat(100)
      const result = validateWatchListName(longName)
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBe('')
    })

    it('日本語の名前の場合はtrueを返す', () => {
      const result = validateWatchListName('日本語の監視リスト名')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBe('')
    })

    it('記号を含む名前の場合はtrueを返す', () => {
      const result = validateWatchListName('Watch List - 2024 (Updated)')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBe('')
    })

    it('前後に空白がある場合でも有効と判定される', () => {
      const result = validateWatchListName('  Valid Name  ')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBe('')
    })
  })

  describe('異常系', () => {
    it('nullの場合はfalseを返す', () => {
      const result = validateWatchListName(null as any)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name is required')
    })

    it('undefinedの場合はfalseを返す', () => {
      const result = validateWatchListName(undefined as any)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name is required')
    })

    it('空文字列の場合はfalseを返す', () => {
      const result = validateWatchListName('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name cannot be empty')
    })

    it('空白のみの場合はfalseを返す', () => {
      const result = validateWatchListName('   ')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name cannot be empty')
    })

    it('タブのみの場合はfalseを返す', () => {
      const result = validateWatchListName('\t\t\t')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name cannot be empty')
    })

    it('改行のみの場合はfalseを返す', () => {
      const result = validateWatchListName('\n\n')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name cannot be empty')
    })

    it('101文字の場合はfalseを返す', () => {
      const tooLongName = 'a'.repeat(101)
      const result = validateWatchListName(tooLongName)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name must be 100 characters or less')
    })

    it('数値の場合はfalseを返す', () => {
      const result = validateWatchListName(123 as any)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name is required')
    })

    it('オブジェクトの場合はfalseを返す', () => {
      const result = validateWatchListName({} as any)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name is required')
    })

    it('配列の場合はfalseを返す', () => {
      const result = validateWatchListName([] as any)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name is required')
    })

    it('制御文字を含む場合はfalseを返す', () => {
      const invalidName = 'Test\x00Name'
      const result = validateWatchListName(invalidName)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name contains invalid characters')
    })

    it('NULL文字を含む場合はfalseを返す', () => {
      const invalidName = 'Test\0Name'
      const result = validateWatchListName(invalidName)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name contains invalid characters')
    })

    it('DEL文字を含む場合はfalseを返す', () => {
      const invalidName = 'Test\x7FName'
      const result = validateWatchListName(invalidName)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Watch list name contains invalid characters')
    })
  })
})
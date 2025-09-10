import { describe, it, expect } from 'vitest'
import { createLawId, LawId, isValidLawIdFormat } from './law-id'

describe('LawId Value Object', () => {
  describe('createLawId', () => {
    it('有効なIDで正常にLawIdを作成する', () => {
      const validId = '322AC0000000049'
      const lawId = createLawId(validId)
      
      expect(lawId).toBe(validId)
      expect(typeof lawId).toBe('string')
    })

    it('法令IDフォーマットが有効な場合に作成される', () => {
      const validIds = [
        '322AC0000000049', // 労働基準法
        '324AC0000000100', // 建設業法
        '347AC0000000057'  // 労働安全衛生法
      ]

      validIds.forEach(id => {
        expect(() => createLawId(id)).not.toThrow()
      })
    })

    it('空文字列の場合はエラーを投げる', () => {
      expect(() => createLawId('')).toThrow('LawId は空にできません')
    })

    it('空白のみの場合はエラーを投げる', () => {
      expect(() => createLawId('   ')).toThrow('LawId は空にできません')
    })

    it('nullやundefinedの場合はエラーを投げる', () => {
      expect(() => createLawId(null as any)).toThrow('LawId は空にできません')
      expect(() => createLawId(undefined as any)).toThrow('LawId は空にできません')
    })

    it('無効なフォーマットの場合はエラーを投げる', () => {
      const invalidIds = [
        'abc123',        // 短すぎる
        '123',           // 短すぎる
        'INVALID_FORMAT', // フォーマットが違う
        '322ac0000000049' // 小文字混じり
      ]

      invalidIds.forEach(id => {
        expect(() => createLawId(id)).toThrow('無効な法令IDフォーマットです')
      })
    })
  })

  describe('isValidLawIdFormat', () => {
    it('有効なフォーマットの場合はtrueを返す', () => {
      const validIds = [
        '322AC0000000049',
        '324AC0000000100',
        '347AC0000000057'
      ]

      validIds.forEach(id => {
        expect(isValidLawIdFormat(id)).toBe(true)
      })
    })

    it('無効なフォーマットの場合はfalseを返す', () => {
      const invalidIds = [
        '',
        'abc',
        '123',
        '322ac0000000049', // 小文字
        'TOOLONGIDFORMAT123456789'
      ]

      invalidIds.forEach(id => {
        expect(isValidLawIdFormat(id)).toBe(false)
      })
    })
  })

  describe('型安全性', () => {
    it('LawIdは通常のstringと区別される', () => {
      const lawId = createLawId('322AC0000000049')
      const regularString: string = '322AC0000000049'
      
      // 型レベルでの区別（TypeScriptコンパイル時チェック）
      // 実行時には同じstringだが、型システムで区別される
      expect(lawId).toBe(regularString)
      
      // 関数が正しい型を要求することを確認
      function requiresLawId(id: LawId): string {
        return `Law: ${id}`
      }
      
      expect(() => requiresLawId(lawId)).not.toThrow()
      // requiresLawId(regularString) // これはTypeScriptエラーになる
    })
  })
})
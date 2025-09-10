import { describe, it, expect } from 'vitest'
import { createLawIdSafe, createLawId, isValidLawIdFormat, LAW_ID_ERRORS } from './law-id-safe'
import { isSuccess, isFailure } from '../../common/result'

describe('LawId Safe (Result型版)', () => {
  describe('createLawIdSafe', () => {
    it('有効なIDで成功結果を返す', () => {
      const result = createLawIdSafe('322AC0000000049')
      
      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('322AC0000000049')
      }
    })

    it('複数の有効なIDで成功する', () => {
      const validIds = [
        '322AC0000000049', // 労働基準法
        '324AC0000000100', // 建設業法
        '347AC0000000057'  // 労働安全衛生法
      ]

      validIds.forEach(id => {
        const result = createLawIdSafe(id)
        expect(isSuccess(result)).toBe(true)
      })
    })

    it('空文字列の場合はEMPTY_VALUEエラー', () => {
      const result = createLawIdSafe('')
      
      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error).toBe('EMPTY_VALUE')
      }
    })

    it('空白のみの場合はEMPTY_VALUEエラー', () => {
      const result = createLawIdSafe('   ')
      
      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error).toBe('EMPTY_VALUE')
      }
    })

    it('無効なフォーマットの場合はINVALID_FORMATエラー', () => {
      const invalidIds = [
        'abc123',        // 短すぎる
        '123',           // 短すぎる
        'INVALID_FORMAT', // フォーマットが違う
        '322ac0000000049' // 小文字混じり
      ]

      invalidIds.forEach(id => {
        const result = createLawIdSafe(id)
        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error).toBe('INVALID_FORMAT')
        }
      })
    })
  })

  describe('従来のcreateeLawId（互換性）', () => {
    it('有効なIDで正常にLawIdを作成する', () => {
      expect(() => createLawId('322AC0000000049')).not.toThrow()
    })

    it('無効なIDで適切なエラーメッセージを投げる', () => {
      expect(() => createLawId('')).toThrow(LAW_ID_ERRORS.EMPTY_VALUE)
      expect(() => createLawId('invalid')).toThrow(LAW_ID_ERRORS.INVALID_FORMAT)
    })
  })

  describe('エラーハンドリングの改善例', () => {
    it('複数の法令IDを安全に検証できる', () => {
      const ids = ['322AC0000000049', 'invalid', '324AC0000000100']
      const results = ids.map(createLawIdSafe)
      
      const validLawIds = results
        .filter(isSuccess)
        .map(result => result.data)
      
      const errors = results
        .filter(isFailure)
        .map(result => result.error)
      
      expect(validLawIds).toHaveLength(2)
      expect(errors).toEqual(['INVALID_FORMAT'])
    })

    it('エラー種別によって処理を分岐できる', () => {
      const handleLawIdCreation = (id: string) => {
        const result = createLawIdSafe(id)
        
        if (isSuccess(result)) {
          return `Valid ID: ${result.data}`
        }
        
        switch (result.error) {
          case 'EMPTY_VALUE':
            return 'IDを入力してください'
          case 'INVALID_FORMAT':
            return 'IDの形式が正しくありません'
          default:
            return '不明なエラー'
        }
      }
      
      expect(handleLawIdCreation('322AC0000000049')).toBe('Valid ID: 322AC0000000049')
      expect(handleLawIdCreation('')).toBe('IDを入力してください')
      expect(handleLawIdCreation('invalid')).toBe('IDの形式が正しくありません')
    })
  })

  describe('型安全性の向上', () => {
    it('Result型により例外なしでエラーハンドリングできる', () => {
      // コンパイル時に全てのエラーケースの処理が強制される
      const processLawId = (id: string): string => {
        const result = createLawIdSafe(id)
        
        // TypeScriptが成功/失敗の両方のケースを要求
        if (isSuccess(result)) {
          return `Processing ${result.data}`
        } else {
          return `Error: ${LAW_ID_ERRORS[result.error]}`
        }
      }
      
      expect(processLawId('322AC0000000049')).toContain('Processing')
      expect(processLawId('invalid')).toContain('Error:')
    })
  })
})
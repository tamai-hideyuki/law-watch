import { describe, it, expect, beforeEach } from 'vitest'
import { HashService, LawContent } from './hash-service'

describe('HashService', () => {
  let hashService: HashService

  beforeEach(() => {
    hashService = new HashService()
  })

  describe('generateContentHash', () => {
    it('同じ内容に対して同じハッシュを生成する', () => {
      const content: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07'
      }

      const hash1 = hashService.generateContentHash(content)
      const hash2 = hashService.generateContentHash(content)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256は64文字の16進数
    })

    it('異なる内容に対して異なるハッシュを生成する', () => {
      const content1: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07'
      }

      const content2: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法（改正版）', // 名前が変更
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07'
      }

      const hash1 = hashService.generateContentHash(content1)
      const hash2 = hashService.generateContentHash(content2)

      expect(hash1).not.toBe(hash2)
    })

    it('空白文字の正規化を行う', () => {
      const content1: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07',
        fullText: '第一条  労働条件は、労働者が人たるに値する生活を営むための必要を充たすべきものでなければならない。'
      }

      const content2: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07',
        fullText: '第一条  労働条件は、労働者が人たるに値する生活を営むための必要を充たすべきものでなければならない。' // 同じ内容（スペースが異なる）
      }

      const hash1 = hashService.generateContentHash(content1)
      const hash2 = hashService.generateContentHash(content2)

      expect(hash1).toBe(hash2)
    })
  })

  describe('compareHashes', () => {
    it('同一のハッシュを正しく比較する', () => {
      const hash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      
      const result = hashService.compareHashes(hash, hash)
      
      expect(result).toBe(true)
    })

    it('異なるハッシュを正しく比較する', () => {
      const hash1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const hash2 = 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
      
      const result = hashService.compareHashes(hash1, hash2)
      
      expect(result).toBe(false)
    })
  })

  describe('detectChangedFields', () => {
    it('変更されたフィールドを検出する', () => {
      const oldContent: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07'
      }

      const newContent: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法（令和7年改正版）',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '改正',
        promulgationDate: '1947-04-07'
      }

      const changedFields = hashService.detectChangedFields(oldContent, newContent)

      expect(changedFields).toContain('name')
      expect(changedFields).toContain('status')
      expect(changedFields).not.toContain('number')
      expect(changedFields).not.toContain('category')
      expect(changedFields).not.toContain('promulgationDate')
    })

    it('変更がない場合は空配列を返す', () => {
      const content: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07'
      }

      const changedFields = hashService.detectChangedFields(content, content)

      expect(changedFields).toEqual([])
    })

    it('全てのフィールドが変更された場合を検出する', () => {
      const oldContent: LawContent = {
        id: '322AC0000000049',
        name: '労働基準法',
        number: '昭和二十二年法律第四十九号',
        category: '労働',
        status: '施行中',
        promulgationDate: '1947-04-07',
        fullText: '旧条文'
      }

      const newContent: LawContent = {
        id: '322AC0000000049',
        name: '新労働基準法',
        number: '令和七年法律第一号',
        category: '福祉',
        status: '改正',
        promulgationDate: '2025-01-01',
        fullText: '新条文'
      }

      const changedFields = hashService.detectChangedFields(oldContent, newContent)

      expect(changedFields).toContain('name')
      expect(changedFields).toContain('number')
      expect(changedFields).toContain('category')
      expect(changedFields).toContain('status')
      expect(changedFields).toContain('promulgationDate')
      expect(changedFields).toContain('fullText')
    })
  })
})
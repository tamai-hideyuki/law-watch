import { describe, it, expect } from 'vitest'
import { 
  LawCategory, 
  LAW_CATEGORIES, 
  isValidLawCategory, 
  createLawCategory 
} from './law-category'

describe('LawCategory', () => {
  describe('LAW_CATEGORIES', () => {
    it('should contain all valid law categories', () => {
      expect(LAW_CATEGORIES).toEqual([
        '全法令',
        '憲法・法律',
        '政令・勅令',
        '府省令・規則'
      ])
    })

    it('should be a readonly array', () => {
      expect(LAW_CATEGORIES).toHaveLength(4)
      // TypeScript ensures it's readonly at compile time
    })
  })

  describe('isValidLawCategory', () => {
    it('should return true for valid categories', () => {
      LAW_CATEGORIES.forEach(category => {
        expect(isValidLawCategory(category)).toBe(true)
      })
    })

    it('should return false for invalid categories', () => {
      const invalidCategories = [
        '',
        'invalid',
        '無効なカテゴリ',
        'law',
        'constitution',
        null,
        undefined,
        123,
        {}
      ]

      invalidCategories.forEach(category => {
        expect(isValidLawCategory(category as string)).toBe(false)
      })
    })

    it('should be case sensitive', () => {
      expect(isValidLawCategory('全法令')).toBe(true)
      expect(isValidLawCategory('全法令 ')).toBe(false) // with trailing space
      expect(isValidLawCategory(' 全法令')).toBe(false) // with leading space
      // Note: Japanese characters don't have uppercase/lowercase, so this test is not applicable
      expect(isValidLawCategory('INVALID_ENGLISH')).toBe(false)
    })
  })

  describe('createLawCategory', () => {
    it('should create valid law categories', () => {
      LAW_CATEGORIES.forEach(category => {
        const result = createLawCategory(category)
        expect(result).toBe(category)
        expect(result).toSatisfy((val: LawCategory) => 
          LAW_CATEGORIES.includes(val)
        )
      })
    })

    it('should throw error for invalid categories', () => {
      const invalidCategories = [
        '',
        'invalid',
        '無効なカテゴリ',
        'law',
        'constitution'
      ]

      invalidCategories.forEach(category => {
        expect(() => createLawCategory(category)).toThrow(
          `Invalid law category: ${category}`
        )
      })
    })

    it('should throw error for null and undefined', () => {
      expect(() => createLawCategory(null as any)).toThrow()
      expect(() => createLawCategory(undefined as any)).toThrow()
    })

    it('should preserve the exact string value', () => {
      const category = '憲法・法律'
      const result = createLawCategory(category)
      expect(result).toBe(category)
      expect(typeof result).toBe('string')
    })
  })

  describe('type safety', () => {
    it('should provide proper TypeScript types', () => {
      const category: LawCategory = '全法令'
      expect(category).toBe('全法令')
      
      // This ensures the type is properly narrowed
      const isValid = isValidLawCategory('全法令')
      if (isValid) {
        const validCategory: LawCategory = '全法令'
        expect(validCategory).toBe('全法令')
      }
    })
  })
})
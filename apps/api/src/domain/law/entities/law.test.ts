import { describe, it, expect } from 'vitest'
import { createLaw, isLawActive, getLawAge, getLawDetailUrl, Law } from './law'

describe('Law Entity', () => {
  const validLawParams = {
    id: '322AC0000000049',
    name: '労働基準法',
    number: '昭和二十二年法律第四十九号',
    promulgationDate: new Date('1947-04-07'),
    category: '憲法・法律',
    status: '施行中'
  }

  describe('createLaw', () => {
    it('should create a valid law', () => {
      const law = createLaw(validLawParams)
      
      expect(law.name).toBe('労働基準法')
      expect(law.number).toBe('昭和二十二年法律第四十九号')
      expect(law.promulgationDate).toEqual(new Date('1947-04-07'))
    })

    it('should throw error for empty name', () => {
      expect(() => {
        createLaw({ ...validLawParams, name: '' })
      }).toThrow('Law name cannot be empty')
    })

    it('should throw error for whitespace-only name', () => {
      expect(() => {
        createLaw({ ...validLawParams, name: '   ' })
      }).toThrow('Law name cannot be empty')
    })

    it('should throw error for empty number', () => {
      expect(() => {
        createLaw({ ...validLawParams, number: '' })
      }).toThrow('Law number cannot be empty')
    })

    it('should trim name and number', () => {
      const law = createLaw({
        ...validLawParams,
        name: '  労働基準法  ',
        number: '  昭和二十二年法律第四十九号  '
      })
      
      expect(law.name).toBe('労働基準法')
      expect(law.number).toBe('昭和二十二年法律第四十九号')
    })

    it('should handle optional lastModified field', () => {
      const lastModified = new Date('2024-01-01')
      const law = createLaw({
        ...validLawParams,
        lastModified
      })
      
      expect(law.lastModified).toEqual(lastModified)
    })
  })

  describe('isLawActive', () => {
    it('should return true for active law', () => {
      const law = createLaw({ ...validLawParams, status: '施行中' })
      
      expect(isLawActive(law)).toBe(true)
    })

    it('should return false for abolished law', () => {
      const law = createLaw({ ...validLawParams, status: '廃止' })
      
      expect(isLawActive(law)).toBe(false)
    })
  })

  describe('getLawAge', () => {
    it('should calculate correct age for old law', () => {
      const law = createLaw({
        ...validLawParams,
        promulgationDate: new Date('1947-04-07') // 労働基準法の実際の公布日
      })
      
      const age = getLawAge(law)
      const currentYear = new Date().getFullYear()
      const expectedAge = currentYear - 1947
      
      expect(age).toBeGreaterThanOrEqual(expectedAge - 1)
      expect(age).toBeLessThanOrEqual(expectedAge)
    })

    it('should return 0 for recently enacted law', () => {
      const law = createLaw({
        ...validLawParams,
        promulgationDate: new Date() // 今日公布
      })
      
      const age = getLawAge(law)
      expect(age).toBe(0)
    })
  })

  describe('getLawDetailUrl', () => {
    it('should return correct e-Gov detail URL for labor standards law', () => {
      const law = createLaw({
        ...validLawParams,
        id: '322AC0000000049' // 労働基準法
      })
      
      const url = getLawDetailUrl(law)
      expect(url).toBe('https://laws.e-gov.go.jp/law/322AC0000000049')
    })

    it('should return correct e-Gov detail URL for building standards law', () => {
      const law = createLaw({
        ...validLawParams,
        id: '325AC1000000201', // 建築基準法
        name: '建築基準法',
        number: '昭和二十五年法律第二百一号',
        category: '憲法・法律'
      })
      
      const url = getLawDetailUrl(law)
      expect(url).toBe('https://laws.e-gov.go.jp/law/325AC1000000201')
    })

    it('should return correct e-Gov detail URL for various law IDs', () => {
      const testCases = [
        { id: '347AC0000000057', expected: 'https://laws.e-gov.go.jp/law/347AC0000000057' }, // 労働安全衛生法
        { id: '360AC0000000088', expected: 'https://laws.e-gov.go.jp/law/360AC0000000088' }, // 労働者派遣法
        { id: '412AC0000000061', expected: 'https://laws.e-gov.go.jp/law/412AC0000000061' }  // 消費者契約法
      ]

      testCases.forEach(({ id, expected }) => {
        const law = createLaw({
          ...validLawParams,
          id,
          name: `テスト法令 ${id}`,
          category: '憲法・法律'
        })
        
        const url = getLawDetailUrl(law)
        expect(url).toBe(expected)
      })
    })
  })
})
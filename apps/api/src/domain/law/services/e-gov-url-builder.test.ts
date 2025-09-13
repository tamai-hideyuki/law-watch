import { describe, it, expect } from 'vitest'
import { EGovUrlBuilder } from './e-gov-url-builder'
import { createLawId } from '../value-objects'

describe('EGovUrlBuilder', () => {
  describe('buildLawDetailUrl', () => {
    it('should build correct URL for valid law ID', () => {
      const lawId = createLawId('322AC0000000049') // 労働基準法
      const url = EGovUrlBuilder.buildLawDetailUrl(lawId)
      
      expect(url).toBe('https://laws.e-gov.go.jp/law/322AC0000000049')
    })

    it('should build correct URL for building standards law', () => {
      const lawId = createLawId('325AC1000000201') // 建築基準法
      const url = EGovUrlBuilder.buildLawDetailUrl(lawId)
      
      expect(url).toBe('https://laws.e-gov.go.jp/law/325AC1000000201')
    })
  })

  describe('buildLawDetailUrlFromString', () => {
    it('should build correct URL for valid law ID string', () => {
      const url = EGovUrlBuilder.buildLawDetailUrlFromString('322AC0000000049')
      
      expect(url).toBe('https://laws.e-gov.go.jp/law/322AC0000000049')
    })

    it('should throw error for empty law ID', () => {
      expect(() => {
        EGovUrlBuilder.buildLawDetailUrlFromString('')
      }).toThrow('Law ID cannot be empty')
    })

    it('should throw error for whitespace-only law ID', () => {
      expect(() => {
        EGovUrlBuilder.buildLawDetailUrlFromString('   ')
      }).toThrow('Law ID cannot be empty')
    })

    it('should throw error for invalid law ID format', () => {
      expect(() => {
        EGovUrlBuilder.buildLawDetailUrlFromString('invalid-id')
      }).toThrow('Invalid law ID format: invalid-id')
    })

    it('should throw error for too short law ID', () => {
      expect(() => {
        EGovUrlBuilder.buildLawDetailUrlFromString('123ABC')
      }).toThrow('Invalid law ID format: 123ABC')
    })

    it('should throw error for too long law ID', () => {
      expect(() => {
        EGovUrlBuilder.buildLawDetailUrlFromString('322AC0000000049EXTRA')
      }).toThrow('Invalid law ID format: 322AC0000000049EXTRA')
    })
  })

  describe('getSearchTopUrl', () => {
    it('should return correct e-Gov top page URL', () => {
      const url = EGovUrlBuilder.getSearchTopUrl()
      
      expect(url).toBe('https://laws.e-gov.go.jp')
    })
  })

  describe('buildKeywordSearchUrl', () => {
    it('should build correct keyword search URL', () => {
      const url = EGovUrlBuilder.buildKeywordSearchUrl('労働基準法')
      
      expect(url).toBe('https://laws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0100/?searchWord=%E5%8A%B4%E5%83%8D%E5%9F%BA%E6%BA%96%E6%B3%95')
    })

    it('should handle keywords with spaces', () => {
      const url = EGovUrlBuilder.buildKeywordSearchUrl('労働 基準法')
      
      expect(url).toBe('https://laws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0100/?searchWord=%E5%8A%B4%E5%83%8D%20%E5%9F%BA%E6%BA%96%E6%B3%95')
    })

    it('should handle special characters in keywords', () => {
      const url = EGovUrlBuilder.buildKeywordSearchUrl('建築基準法（改正）')
      
      expect(url).toContain('searchWord=')
      expect(decodeURIComponent(url.split('searchWord=')[1])).toBe('建築基準法（改正）')
    })

    it('should trim whitespace from keywords', () => {
      const url = EGovUrlBuilder.buildKeywordSearchUrl('  労働基準法  ')
      
      expect(url).toBe('https://laws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0100/?searchWord=%E5%8A%B4%E5%83%8D%E5%9F%BA%E6%BA%96%E6%B3%95')
    })

    it('should throw error for empty keyword', () => {
      expect(() => {
        EGovUrlBuilder.buildKeywordSearchUrl('')
      }).toThrow('Search keyword cannot be empty')
    })

    it('should throw error for whitespace-only keyword', () => {
      expect(() => {
        EGovUrlBuilder.buildKeywordSearchUrl('   ')
      }).toThrow('Search keyword cannot be empty')
    })
  })
})
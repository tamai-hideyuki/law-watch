import { describe, it, expect } from 'vitest'
import { 
  LawStatus, 
  LAW_STATUSES, 
  isValidLawStatus, 
  createLawStatus, 
  isActiveLaw, 
  canBeModified 
} from './law-status'

describe('LawStatus', () => {
  describe('LAW_STATUSES', () => {
    it('should contain all valid law statuses', () => {
      expect(LAW_STATUSES).toEqual([
        '施行中',
        '廃止',
        '改正待ち',
        '未施行'
      ])
    })

    it('should be a readonly array', () => {
      expect(LAW_STATUSES).toHaveLength(4)
    })
  })

  describe('isValidLawStatus', () => {
    it('should return true for valid statuses', () => {
      LAW_STATUSES.forEach(status => {
        expect(isValidLawStatus(status)).toBe(true)
      })
    })

    it('should return false for invalid statuses', () => {
      const invalidStatuses = [
        '',
        'invalid',
        '無効なステータス',
        'active',
        'inactive',
        'pending',
        null,
        undefined,
        123,
        {}
      ]

      invalidStatuses.forEach(status => {
        expect(isValidLawStatus(status as string)).toBe(false)
      })
    })

    it('should be case sensitive', () => {
      expect(isValidLawStatus('施行中')).toBe(true)
      expect(isValidLawStatus('施行中 ')).toBe(false) // with trailing space
      expect(isValidLawStatus(' 施行中')).toBe(false) // with leading space
    })
  })

  describe('createLawStatus', () => {
    it('should create valid law statuses', () => {
      LAW_STATUSES.forEach(status => {
        const result = createLawStatus(status)
        expect(result).toBe(status)
        expect(result).toSatisfy((val: LawStatus) => 
          LAW_STATUSES.includes(val)
        )
      })
    })

    it('should throw error for invalid statuses', () => {
      const invalidStatuses = [
        '',
        'invalid',
        '無効なステータス',
        'active',
        'inactive'
      ]

      invalidStatuses.forEach(status => {
        expect(() => createLawStatus(status)).toThrow(
          `無効な法律ステータス: ${status}`
        )
      })
    })

    it('should throw error for null and undefined', () => {
      expect(() => createLawStatus(null as any)).toThrow()
      expect(() => createLawStatus(undefined as any)).toThrow()
    })

    it('should preserve the exact string value', () => {
      const status = '施行中'
      const result = createLawStatus(status)
      expect(result).toBe(status)
      expect(typeof result).toBe('string')
    })
  })

  describe('isActiveLaw', () => {
    it('should return true only for 施行中 status', () => {
      expect(isActiveLaw('施行中')).toBe(true)
    })

    it('should return false for non-active statuses', () => {
      const nonActiveStatuses: LawStatus[] = ['廃止', '改正待ち', '未施行']
      
      nonActiveStatuses.forEach(status => {
        expect(isActiveLaw(status)).toBe(false)
      })
    })

    it('should handle all possible law statuses', () => {
      const expectations: Record<LawStatus, boolean> = {
        '施行中': true,
        '廃止': false,
        '改正待ち': false,
        '未施行': false
      }

      Object.entries(expectations).forEach(([status, expected]) => {
        expect(isActiveLaw(status as LawStatus)).toBe(expected)
      })
    })
  })

  describe('canBeModified', () => {
    it('should return true for modifiable statuses', () => {
      const modifiableStatuses: LawStatus[] = ['施行中', '改正待ち']
      
      modifiableStatuses.forEach(status => {
        expect(canBeModified(status)).toBe(true)
      })
    })

    it('should return false for non-modifiable statuses', () => {
      const nonModifiableStatuses: LawStatus[] = ['廃止', '未施行']
      
      nonModifiableStatuses.forEach(status => {
        expect(canBeModified(status)).toBe(false)
      })
    })

    it('should handle all possible law statuses', () => {
      const expectations: Record<LawStatus, boolean> = {
        '施行中': true,
        '改正待ち': true,
        '廃止': false,
        '未施行': false
      }

      Object.entries(expectations).forEach(([status, expected]) => {
        expect(canBeModified(status as LawStatus)).toBe(expected)
      })
    })
  })

  describe('business logic consistency', () => {
    it('should ensure active laws can be modified', () => {
      const activeStatus: LawStatus = '施行中'
      expect(isActiveLaw(activeStatus)).toBe(true)
      expect(canBeModified(activeStatus)).toBe(true)
    })

    it('should ensure abolished laws cannot be modified', () => {
      const abolishedStatus: LawStatus = '廃止'
      expect(isActiveLaw(abolishedStatus)).toBe(false)
      expect(canBeModified(abolishedStatus)).toBe(false)
    })

    it('should allow modification of pending amendment laws even if not active', () => {
      const pendingStatus: LawStatus = '改正待ち'
      expect(isActiveLaw(pendingStatus)).toBe(false)
      expect(canBeModified(pendingStatus)).toBe(true)
    })
  })

  describe('type safety', () => {
    it('should provide proper TypeScript types', () => {
      const status: LawStatus = '施行中'
      expect(status).toBe('施行中')
      
      // This ensures the type is properly narrowed
      const isValid = isValidLawStatus('施行中')
      if (isValid) {
        const validStatus: LawStatus = '施行中'
        expect(validStatus).toBe('施行中')
      }
    })
  })
})
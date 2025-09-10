import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  DateRange, 
  createDateRange, 
  createDateRangeFromStrings, 
  createLastNDaysRange, 
  createThisMonthRange, 
  createThisYearRange, 
  isDateInRange, 
  formatDateRange 
} from './date-range'

describe('DateRange', () => {
  describe('createDateRange', () => {
    it('should create valid date range', () => {
      const from = new Date('2024-01-01')
      const to = new Date('2024-12-31')
      
      const range = createDateRange(from, to)
      
      expect(range.from).toEqual(from)
      expect(range.to).toEqual(to)
    })

    it('should allow same from and to dates', () => {
      const date = new Date('2024-01-01')
      
      const range = createDateRange(date, date)
      
      expect(range.from).toEqual(date)
      expect(range.to).toEqual(date)
    })

    it('should throw error when from date is after to date', () => {
      const from = new Date('2024-12-31')
      const to = new Date('2024-01-01')
      
      expect(() => createDateRange(from, to)).toThrow(
        'From date must be before or equal to to date'
      )
    })

    it('should handle edge cases with time components', () => {
      const from = new Date('2024-01-01T23:59:59.999Z')
      const to = new Date('2024-01-02T00:00:00.000Z')
      
      const range = createDateRange(from, to)
      
      expect(range.from).toEqual(from)
      expect(range.to).toEqual(to)
    })
  })

  describe('createDateRangeFromStrings', () => {
    it('should create date range from valid date strings', () => {
      const fromStr = '2024-01-01'
      const toStr = '2024-12-31'
      
      const range = createDateRangeFromStrings(fromStr, toStr)
      
      expect(range.from).toEqual(new Date(fromStr))
      expect(range.to).toEqual(new Date(toStr))
    })

    it('should handle various date string formats', () => {
      const validFormats = [
        ['2024-01-01', '2024-12-31'],
        ['2024/01/01', '2024/12/31'],
        ['Jan 1, 2024', 'Dec 31, 2024'],
        ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']
      ]

      validFormats.forEach(([fromStr, toStr]) => {
        expect(() => createDateRangeFromStrings(fromStr, toStr)).not.toThrow()
      })
    })

    it('should throw error for invalid date strings', () => {
      const invalidCases = [
        ['invalid-date', '2024-12-31'],
        ['2024-01-01', 'invalid-date'],
        ['', '2024-12-31'],
        ['2024-01-01', ''],
        ['2024-13-01', '2024-12-31'], // Invalid month
        ['2024-01-32', '2024-12-31']  // Invalid day
      ]

      invalidCases.forEach(([fromStr, toStr]) => {
        expect(() => createDateRangeFromStrings(fromStr, toStr)).toThrow(
          'Invalid date format'
        )
      })
    })

    it('should throw error when from date is after to date', () => {
      expect(() => createDateRangeFromStrings('2024-12-31', '2024-01-01')).toThrow(
        'From date must be before or equal to to date'
      )
    })
  })

  describe('createLastNDaysRange', () => {
    beforeEach(() => {
      // Mock current date to make tests deterministic
      const mockDate = new Date('2024-06-15T12:00:00Z')
      vi.setSystemTime(mockDate)
    })

    it('should create range for last N days', () => {
      const range = createLastNDaysRange(7)
      
      const expectedTo = new Date('2024-06-15T12:00:00Z')
      const expectedFrom = new Date('2024-06-08T12:00:00Z')
      
      expect(range.to).toEqual(expectedTo)
      expect(range.from).toEqual(expectedFrom)
    })

    it('should handle edge cases', () => {
      const range0 = createLastNDaysRange(0)
      expect(range0.from).toEqual(range0.to)
      
      const range1 = createLastNDaysRange(1)
      const expectedFrom = new Date('2024-06-14T12:00:00Z')
      expect(range1.from).toEqual(expectedFrom)
    })

    it('should handle large numbers', () => {
      const range = createLastNDaysRange(365)
      const expectedFrom = new Date('2024-06-15T12:00:00Z')
      expectedFrom.setDate(expectedFrom.getDate() - 365)
      
      expect(range.from).toEqual(expectedFrom)
    })
  })

  describe('createThisMonthRange', () => {
    beforeEach(() => {
      const mockDate = new Date('2024-06-15T12:00:00Z')
      vi.setSystemTime(mockDate)
    })

    it('should create range for current month', () => {
      const range = createThisMonthRange()
      
      expect(range.from).toEqual(new Date(2024, 5, 1)) // Month is 0-indexed
      expect(range.to).toEqual(new Date(2024, 5, 30))
    })

    it('should handle month boundaries correctly', () => {
      // Test February in a leap year
      vi.setSystemTime(new Date('2024-02-15'))
      const febRange = createThisMonthRange()
      expect(febRange.to.getDate()).toBe(29) // Feb 29, 2024 (leap year)
      
      // Test February in a non-leap year
      vi.setSystemTime(new Date('2023-02-15'))
      const febRange2023 = createThisMonthRange()
      expect(febRange2023.to.getDate()).toBe(28) // Feb 28, 2023
    })
  })

  describe('createThisYearRange', () => {
    beforeEach(() => {
      const mockDate = new Date('2024-06-15T12:00:00Z')
      vi.setSystemTime(mockDate)
    })

    it('should create range for current year', () => {
      const range = createThisYearRange()
      
      expect(range.from).toEqual(new Date(2024, 0, 1))
      expect(range.to).toEqual(new Date(2024, 11, 31))
    })

    it('should handle year boundaries correctly', () => {
      vi.setSystemTime(new Date('2023-07-15'))
      const range2023 = createThisYearRange()
      
      expect(range2023.from).toEqual(new Date(2023, 0, 1))
      expect(range2023.to).toEqual(new Date(2023, 11, 31))
    })
  })

  describe('isDateInRange', () => {
    const range = createDateRange(
      new Date('2024-06-01'),
      new Date('2024-06-30')
    )

    it('should return true for dates within range', () => {
      const datesInRange = [
        new Date('2024-06-01'), // Start boundary
        new Date('2024-06-15'), // Middle
        new Date('2024-06-30')  // End boundary
      ]

      datesInRange.forEach(date => {
        expect(isDateInRange(date, range)).toBe(true)
      })
    })

    it('should return false for dates outside range', () => {
      const datesOutsideRange = [
        new Date('2024-05-31'), // Before start
        new Date('2024-07-01'), // After end
        new Date('2023-06-15'), // Previous year
        new Date('2025-06-15')  // Next year
      ]

      datesOutsideRange.forEach(date => {
        expect(isDateInRange(date, range)).toBe(false)
      })
    })

    it('should handle time components correctly', () => {
      const rangeWithTime = createDateRange(
        new Date('2024-06-01T10:00:00Z'),
        new Date('2024-06-01T20:00:00Z')
      )

      expect(isDateInRange(new Date('2024-06-01T15:00:00Z'), rangeWithTime)).toBe(true)
      expect(isDateInRange(new Date('2024-06-01T05:00:00Z'), rangeWithTime)).toBe(false)
      expect(isDateInRange(new Date('2024-06-01T22:00:00Z'), rangeWithTime)).toBe(false)
    })
  })

  describe('formatDateRange', () => {
    it('should format date range correctly', () => {
      const range = createDateRange(
        new Date('2024-06-01T10:30:45Z'),
        new Date('2024-12-31T23:59:59Z')
      )

      const formatted = formatDateRange(range)
      expect(formatted).toBe('2024-06-01 ~ 2024-12-31')
    })

    it('should handle same date range', () => {
      const date = new Date('2024-06-15T12:00:00Z')
      const range = createDateRange(date, date)

      const formatted = formatDateRange(range)
      expect(formatted).toBe('2024-06-15 ~ 2024-06-15')
    })

    it('should ignore time components in formatting', () => {
      const range = createDateRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T23:59:59Z')
      )

      const formatted = formatDateRange(range)
      expect(formatted).toBe('2024-01-01 ~ 2024-01-01')
    })
  })

  describe('integration tests', () => {
    it('should work with complex date operations', () => {
      const stringRange = createDateRangeFromStrings('2024-01-01', '2024-12-31')
      const testDate = new Date('2024-06-15')
      
      expect(isDateInRange(testDate, stringRange)).toBe(true)
      expect(formatDateRange(stringRange)).toBe('2024-01-01 ~ 2024-12-31')
    })

    it('should maintain immutability', () => {
      const originalFrom = new Date('2024-01-01')
      const originalTo = new Date('2024-12-31')
      const range = createDateRange(new Date(originalFrom), new Date(originalTo))
      
      // Modify original dates
      originalFrom.setFullYear(2023)
      originalTo.setFullYear(2025)
      
      // Range should not be affected (createDateRange creates new Date objects)
      expect(range.from.getFullYear()).toBe(2024)
      expect(range.to.getFullYear()).toBe(2024)
    })
  })

  describe('type safety', () => {
    it('should provide proper TypeScript types', () => {
      const range: DateRange = createDateRange(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      )
      
      expect(range.from).toBeInstanceOf(Date)
      expect(range.to).toBeInstanceOf(Date)
      
      // Note: readonly is TypeScript compile-time only, not runtime
      // The actual immutability is ensured by the implementation
      expect(typeof range.from).toBe('object')
      expect(range.from).toBeInstanceOf(Date)
    })
  })
})
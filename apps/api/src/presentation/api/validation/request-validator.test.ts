import { describe, it, expect } from 'vitest'
import { 
  validateRequired, 
  validateWatchRequest, 
  validateWatchListRequest 
} from './request-validator'

describe('RequestValidator', () => {
  describe('validateRequired', () => {
    it('should return null for valid values', () => {
      expect(validateRequired('test', 'field')).toBeNull()
      expect(validateRequired(123, 'field')).toBeNull()
      expect(validateRequired(true, 'field')).toBeNull()
    })

    it('should return error for invalid values', () => {
      expect(validateRequired(null, 'field')).toEqual({
        field: 'field',
        message: 'field is required'
      })
      expect(validateRequired(undefined, 'field')).toEqual({
        field: 'field',
        message: 'field is required'
      })
      expect(validateRequired('', 'field')).toEqual({
        field: 'field',
        message: 'field is required'
      })
    })
  })

  describe('validateWatchRequest', () => {
    it('should validate valid watch request', () => {
      const validRequest = {
        watchListId: 'watch-list-1',
        lawId: 'law-1'
      }

      const result = validateWatchRequest(validRequest)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for missing watchListId', () => {
      const invalidRequest = {
        lawId: 'law-1'
      }

      const result = validateWatchRequest(invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'watchListId',
        message: 'watchListId is required'
      })
    })

    it('should return errors for missing lawId', () => {
      const invalidRequest = {
        watchListId: 'watch-list-1'
      }

      const result = validateWatchRequest(invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'lawId',
        message: 'lawId is required'
      })
    })

    it('should return multiple errors for empty request', () => {
      const invalidRequest = {}

      const result = validateWatchRequest(invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('validateWatchListRequest', () => {
    it('should validate valid watch list request', () => {
      const validRequest = {
        userId: 'user-1',
        name: 'My Watch List'
      }

      const result = validateWatchListRequest(validRequest)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for missing userId', () => {
      const invalidRequest = {
        name: 'My Watch List'
      }

      const result = validateWatchListRequest(invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'userId',
        message: 'userId is required'
      })
    })

    it('should return errors for missing name', () => {
      const invalidRequest = {
        userId: 'user-1'
      }

      const result = validateWatchListRequest(invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'name',
        message: 'name is required'
      })
    })

    it('should return multiple errors for empty request', () => {
      const invalidRequest = {}

      const result = validateWatchListRequest(invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })
})
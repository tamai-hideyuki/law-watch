import { describe, it, expect, vi } from 'vitest'
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  badRequestResponse 
} from './api-response'

// Mock Hono Context
const createMockContext = () => ({
  json: vi.fn().mockReturnValue('mocked-response')
})

describe('ApiResponse', () => {
  describe('successResponse', () => {
    it('should create success response without data', () => {
      const c = createMockContext()
      
      successResponse(c as any)
      
      expect(c.json).toHaveBeenCalledWith({
        success: true
      })
    })

    it('should create success response with data', () => {
      const c = createMockContext()
      const testData = { id: 1, name: 'test' }
      
      successResponse(c as any, testData)
      
      expect(c.json).toHaveBeenCalledWith({
        success: true,
        data: testData
      })
    })

    it('should create success response with additional fields', () => {
      const c = createMockContext()
      const testData = { id: 1, name: 'test' }
      const additionalFields = { count: 5, total: 10 }
      
      successResponse(c as any, testData, additionalFields)
      
      expect(c.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        count: 5,
        total: 10
      })
    })
  })

  describe('errorResponse', () => {
    it('should create error response with default status code', () => {
      const c = createMockContext()
      
      errorResponse(c as any, 'Something went wrong')
      
      expect(c.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong'
      }, 500)
    })

    it('should create error response with custom status code', () => {
      const c = createMockContext()
      
      errorResponse(c as any, 'Bad request', 400)
      
      expect(c.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request'
      }, 400)
    })
  })

  describe('notFoundResponse', () => {
    it('should create not found response', () => {
      const c = createMockContext()
      
      notFoundResponse(c as any, 'User')
      
      expect(c.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      }, 404)
    })
  })

  describe('badRequestResponse', () => {
    it('should create bad request response', () => {
      const c = createMockContext()
      
      badRequestResponse(c as any, 'Invalid input')
      
      expect(c.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input'
      }, 400)
    })
  })
})
import { Result, ok, err } from '../../common/result'
import { isValidLawCategory } from '../value-objects/law-category'
import { isValidLawStatus } from '../value-objects/law-status'

export interface SearchValidationError {
  field: string
  message: string
  code: string
}

export interface SearchQuery {
  keyword: string
  category?: string
  status?: string
  limit?: number
  offset?: number
  fromDate?: Date
  toDate?: Date
}

export interface SearchFilters {
  category?: string
  status?: string
  fromDate?: Date
  toDate?: Date
}

export interface PaginationParams {
  limit: number
  offset: number
}

/**
 * Validates search keyword
 */
export const validateSearchKeyword = (keyword: string): Result<boolean, SearchValidationError> => {
  if (!keyword || typeof keyword !== 'string') {
    return err({
      field: 'keyword',
      message: 'Search keyword is required',
      code: 'REQUIRED'
    })
  }

  const trimmed = keyword.trim()
  if (trimmed.length === 0) {
    return err({
      field: 'keyword',
      message: 'Search keyword cannot be empty',
      code: 'EMPTY'
    })
  }

  if (trimmed.length < 2) {
    return err({
      field: 'keyword',
      message: 'Search keyword must be at least 2 characters',
      code: 'TOO_SHORT'
    })
  }

  if (trimmed.length > 100) {
    return err({
      field: 'keyword',
      message: 'Search keyword cannot exceed 100 characters',
      code: 'TOO_LONG'
    })
  }

  // Check for only special characters
  const onlySpecialChars = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/
  if (onlySpecialChars.test(trimmed)) {
    return err({
      field: 'keyword',
      message: 'Search keyword cannot contain only special characters',
      code: 'ONLY_SPECIAL_CHARS'
    })
  }

  return ok(true)
}

/**
 * Validates search limit parameter
 */
export const validateSearchLimit = (limit: any): Result<boolean, SearchValidationError> => {
  if (limit === undefined || limit === null) {
    return ok(true) // Optional parameter
  }

  if (typeof limit !== 'number' || !Number.isInteger(limit)) {
    return err({
      field: 'limit',
      message: 'Limit must be an integer',
      code: 'INVALID_TYPE'
    })
  }

  if (limit < 1) {
    return err({
      field: 'limit',
      message: 'Limit must be at least 1',
      code: 'TOO_SMALL'
    })
  }

  if (limit > 1000) {
    return err({
      field: 'limit',
      message: 'Limit cannot exceed 1000',
      code: 'TOO_LARGE'
    })
  }

  return ok(true)
}

/**
 * Validates search offset parameter
 */
export const validateSearchOffset = (offset: any): Result<boolean, SearchValidationError> => {
  if (offset === undefined || offset === null) {
    return ok(true) // Optional parameter
  }

  if (typeof offset !== 'number' || !Number.isInteger(offset)) {
    return err({
      field: 'offset',
      message: 'Offset must be an integer',
      code: 'INVALID_TYPE'
    })
  }

  if (offset < 0) {
    return err({
      field: 'offset',
      message: 'Offset cannot be negative',
      code: 'NEGATIVE'
    })
  }

  if (offset > 10000) {
    return err({
      field: 'offset',
      message: 'Offset cannot exceed 10000',
      code: 'TOO_LARGE'
    })
  }

  return ok(true)
}

/**
 * Validates search filters
 */
export const validateSearchFilters = (filters: SearchFilters): Result<boolean, SearchValidationError[]> => {
  const errors: SearchValidationError[] = []

  // Validate category filter
  if (filters.category !== undefined && !isValidLawCategory(filters.category)) {
    errors.push({
      field: 'category',
      message: 'Invalid category filter',
      code: 'INVALID_CATEGORY'
    })
  }

  // Validate status filter
  if (filters.status !== undefined && !isValidLawStatus(filters.status)) {
    errors.push({
      field: 'status',
      message: 'Invalid status filter',
      code: 'INVALID_STATUS'
    })
  }

  // Validate date range
  if (filters.fromDate && filters.toDate) {
    if (filters.fromDate > filters.toDate) {
      errors.push({
        field: 'dateRange',
        message: 'From date must be before or equal to to date',
        code: 'INVALID_DATE_RANGE'
      })
    }
  }

  // Validate individual dates
  if (filters.fromDate && isNaN(filters.fromDate.getTime())) {
    errors.push({
      field: 'fromDate',
      message: 'Invalid from date',
      code: 'INVALID_DATE'
    })
  }

  if (filters.toDate && isNaN(filters.toDate.getTime())) {
    errors.push({
      field: 'toDate',
      message: 'Invalid to date',
      code: 'INVALID_DATE'
    })
  }

  if (errors.length > 0) {
    return err(errors)
  }

  return ok(true)
}

/**
 * Validates pagination parameters
 */
export const validatePagination = (params: PaginationParams): Result<boolean, SearchValidationError[]> => {
  const errors: SearchValidationError[] = []

  const limitResult = validateSearchLimit(params.limit)
  if (!limitResult.success) {
    errors.push(limitResult.error)
  }

  const offsetResult = validateSearchOffset(params.offset)
  if (!offsetResult.success) {
    errors.push(offsetResult.error)
  }

  // Business logic: check if offset is reasonable given the limit
  if (limitResult.success && offsetResult.success && params.offset > 0) {
    const estimatedPage = Math.floor(params.offset / params.limit)
    if (estimatedPage > 100) { // Prevent deep pagination abuse
      errors.push({
        field: 'pagination',
        message: 'Pagination too deep. Use more specific search criteria',
        code: 'DEEP_PAGINATION'
      })
    }
  }

  if (errors.length > 0) {
    return err(errors)
  }

  return ok(true)
}

/**
 * Validates complete search query
 */
export const validateSearchQuery = (query: any): Result<boolean, SearchValidationError[]> => {
  if (!query || typeof query !== 'object') {
    return err([{
      field: 'query',
      message: 'Search query object is required',
      code: 'REQUIRED'
    }])
  }

  const errors: SearchValidationError[] = []

  // Validate required keyword
  const keywordResult = validateSearchKeyword(query.keyword)
  if (!keywordResult.success) {
    errors.push(keywordResult.error)
  }

  // Validate optional filters
  const filtersResult = validateSearchFilters({
    category: query.category,
    status: query.status,
    fromDate: query.fromDate,
    toDate: query.toDate
  })
  if (!filtersResult.success) {
    errors.push(...filtersResult.error)
  }

  // Validate optional pagination
  if (query.limit !== undefined || query.offset !== undefined) {
    const paginationResult = validatePagination({
      limit: query.limit || 50,
      offset: query.offset || 0
    })
    if (!paginationResult.success) {
      errors.push(...paginationResult.error)
    }
  }

  if (errors.length > 0) {
    return err(errors)
  }

  return ok(true)
}

/**
 * Sanitizes search keyword by normalizing whitespace and removing control characters
 */
export const sanitizeSearchKeyword = (keyword: string): string => {
  if (!keyword || typeof keyword !== 'string') {
    return ''
  }

  return keyword
    .trim()                                      // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ')                       // Normalize multiple spaces
    .replace(/[\n\r\t]/g, ' ')                  // Replace newlines/tabs with spaces
    .replace(/\u3000/g, ' ')                    // Replace full-width space with regular space
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim()                                      // Final trim
}

/**
 * Validates search scope combination
 */
export const validateSearchScope = (scope: {
  keyword: string
  category?: string
  status?: string
}): Result<boolean, SearchValidationError> => {
  // Business rules for search scope combinations
  
  // If searching in abolished laws, suggest more specific criteria
  if (scope.status === '�b' && scope.keyword.length < 3) {
    return err({
      field: 'scope',
      message: 'Searching abolished laws requires more specific keywords (at least 3 characters)',
      code: 'INSUFFICIENT_CRITERIA'
    })
  }

  // If searching very common terms, suggest using filters
  const commonTerms = ['�', 'n', 'k', '�', 'o', 'L', 'h', 'g', 'Y�', 'jD']
  if (commonTerms.includes(scope.keyword) && !scope.category && !scope.status) {
    return err({
      field: 'scope',
      message: 'Common terms require category or status filters for better results',
      code: 'TOO_BROAD'
    })
  }

  return ok(true)
}

/**
 * Type guard for SearchQuery objects
 */
export const isValidSearchQueryObject = (obj: unknown): obj is SearchQuery => {
  const result = validateSearchQuery(obj)
  return result.success
}
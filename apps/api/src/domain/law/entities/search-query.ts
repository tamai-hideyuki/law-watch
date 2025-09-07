import { 
    LawCategory,
    DateRange,
    createLawCategory
} from '../value-objects'

export interface SearchQuery {
  readonly keyword: string
  readonly category?: LawCategory
  readonly dateRange?: DateRange
  readonly limit?: number
  readonly offset?: number
}

export const createSearchQuery = (params: {
  keyword: string
  category?: string
  dateRange?: DateRange
  limit?: number
  offset?: number
}): SearchQuery => {
  if (!params.keyword || params.keyword.trim().length === 0) {
    throw new Error('Search keyword cannot be empty')
  }

  if (params.limit !== undefined && params.limit <= 0) {
    throw new Error('Limit must be greater than 0')
  }

  if (params.offset !== undefined && params.offset < 0) {
    throw new Error('Offset must be greater than or equal to 0')
  }

  return {
    keyword: params.keyword.trim(),
    category: params.category ? createLawCategory(params.category) : undefined,
    dateRange: params.dateRange,
    limit: params.limit || 20,
    offset: params.offset || 0
  }
}

export const createSimpleSearchQuery = (keyword: string): SearchQuery => {
  return createSearchQuery({ keyword })
}

export const createCategorySearchQuery = (
  keyword: string, 
  category: string
): SearchQuery => {
  return createSearchQuery({ keyword, category })
}

export const isEmptyQuery = (query: SearchQuery): boolean => {
  return query.keyword.trim().length === 0
}

export const hasFilters = (query: SearchQuery): boolean => {
  return !!(query.category || query.dateRange)
}

export const getTotalPages = (totalCount: number, limit: number): number => {
  return Math.ceil(totalCount / limit)
}

export const getCurrentPage = (offset: number, limit: number): number => {
  return Math.floor(offset / limit) + 1
}

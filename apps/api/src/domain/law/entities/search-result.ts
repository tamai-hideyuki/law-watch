import { Law } from './law'
import { SearchQuery } from './search-query'

export interface SearchResult {
  readonly laws: readonly Law[]
  readonly totalCount: number
  readonly query: SearchQuery
  readonly executedAt: Date
}


export const createSearchResult = (params: {
  laws: Law[]
  totalCount: number
  query: SearchQuery
  executedAt?: Date
}): SearchResult => {
  if (params.totalCount < 0) {
    throw new Error('Total count cannot be negative')
  }

  if (params.laws.length > params.totalCount) {
    throw new Error('Laws count cannot exceed total count')
  }

  return {
    laws: Object.freeze(params.laws),
    totalCount: params.totalCount,
    query: params.query,
    executedAt: params.executedAt || new Date()
  }
}

export const createEmptySearchResult = (query: SearchQuery): SearchResult => {
  return createSearchResult({
    laws: [],
    totalCount: 0,
    query
  })
}

export const hasResults = (result: SearchResult): boolean => {
  return result.totalCount > 0
}

export const isPartialResult = (result: SearchResult): boolean => {
  return result.laws.length < result.totalCount
}

export const getResultPage = (result: SearchResult): number => {
  const { query } = result
  return Math.floor((query.offset || 0) / (query.limit || 20)) + 1
}

export const getTotalPages = (result: SearchResult): number => {
  const { query, totalCount } = result
  return Math.ceil(totalCount / (query.limit || 20))
}

export const hasNextPage = (result: SearchResult): boolean => {
  return getResultPage(result) < getTotalPages(result)
}

export const hasPreviousPage = (result: SearchResult): boolean => {
  return getResultPage(result) > 1
}

export const getResultSummary = (result: SearchResult): string => {
  const currentPage = getResultPage(result)
  const totalPages = getTotalPages(result)
  const startIndex = (result.query.offset || 0) + 1
  const endIndex = Math.min(startIndex + result.laws.length - 1, result.totalCount)
  
  return `${startIndex}-${endIndex} of ${result.totalCount} results (Page ${currentPage}/${totalPages})`
}

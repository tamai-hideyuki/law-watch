import { Law } from '../entities/law'

export interface SearchResult {
  readonly laws: readonly Law[]
  readonly totalCount: number
  readonly executedAt: Date
  readonly query?: string
}

export const createSearchResult = (
  laws: Law[], 
  totalCount: number, 
  query?: string
): SearchResult => {
  return {
    laws,
    totalCount,
    executedAt: new Date(),
    query
  }
}

export const createEmptySearchResult = (query?: string): SearchResult => {
  return createSearchResult([], 0, query)
}
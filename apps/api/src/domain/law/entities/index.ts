export { 
  type Law, 
  createLaw, 
  isLawActive, 
  getLawAge 
} from './law'

export { 
  type SearchQuery, 
  createSearchQuery, 
  createSimpleSearchQuery, 
  createCategorySearchQuery,
  isEmptyQuery,
  hasFilters,
  getTotalPages as getQueryTotalPages,
  getCurrentPage as getQueryCurrentPage
} from './search-query'

export { 
  type SearchResult, 
  createSearchResult, 
  createEmptySearchResult,
  hasResults,
  isPartialResult,
  getResultPage,
  getTotalPages as getResultTotalPages,
  hasNextPage,
  hasPreviousPage,
  getResultSummary
} from './search-result'

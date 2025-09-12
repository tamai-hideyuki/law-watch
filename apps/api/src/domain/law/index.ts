// Value Objects (基本的な値オブジェクト)
export { 
  type LawId, 
  createLawId 
} from './value-objects/law-id'

export { 
  type LawCategory, 
  LAW_CATEGORIES, 
  isValidLawCategory, 
  createLawCategory 
} from './value-objects/law-category'

export { 
  type LawStatus, 
  LAW_STATUSES, 
  isValidLawStatus, 
  createLawStatus,
  isActiveLaw,
  canBeModified 
} from './value-objects/law-status'

export { 
  type DateRange, 
  createDateRange, 
  createDateRangeFromStrings,
  createLastNDaysRange,
  createThisMonthRange,
  createThisYearRange,
  isDateInRange,
  formatDateRange 
} from './value-objects/date-range'

// Entities (エンティティ - 複雑な検索クエリとレスポンス)
export { 
  type Law, 
  createLaw, 
  isLawActive, 
  getLawAge 
} from './entities/law'

export { 
  type SearchQuery as ComplexSearchQuery, 
  createSearchQuery as createComplexSearchQuery, 
  createSimpleSearchQuery as createSimpleComplexSearchQuery, 
  createCategorySearchQuery,
  isEmptyQuery,
  hasFilters,
  getTotalPages as getQueryTotalPages,
  getCurrentPage as getQueryCurrentPage
} from './entities/search-query'

export { 
  type SearchResult as ComplexSearchResult, 
  createSearchResult as createComplexSearchResult, 
  createEmptySearchResult as createEmptyComplexSearchResult,
  hasResults,
  isPartialResult,
  getResultPage,
  getTotalPages as getResultTotalPages,
  hasNextPage,
  hasPreviousPage,
  getResultSummary
} from './entities/search-result'

// Value Objects (シンプルな検索クエリとレスポンス)
export {
  type SearchQuery as SimpleSearchQuery,
  createSearchQuery as createSimpleSearchQuery,
  createSimpleSearchQuery as createBasicSearchQuery,
  isValidSearchQuery
} from './value-objects/search-query'

export {
  type SearchResult as SimpleSearchResult,
  createSearchResult as createSimpleSearchResult,
  createEmptySearchResult as createEmptySimpleSearchResult
} from './value-objects/search-result'

//export * from './rules'

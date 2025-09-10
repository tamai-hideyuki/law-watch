export interface SearchQuery {
  readonly keyword: string
  readonly category?: string
  readonly status?: string
  readonly limit?: number
  readonly offset?: number
}

export const createSearchQuery = (keyword: string, options?: Partial<Omit<SearchQuery, 'keyword'>>): SearchQuery => {
  if (!keyword || keyword.trim().length === 0) {
    throw new Error('Search keyword cannot be empty')
  }

  return {
    keyword: keyword.trim(),
    category: options?.category,
    status: options?.status,
    limit: options?.limit || 50,
    offset: options?.offset || 0
  }
}

export const createSimpleSearchQuery = (keyword: string): SearchQuery => {
  return createSearchQuery(keyword)
}

export const isValidSearchQuery = (query: any): query is SearchQuery => {
  return (
    typeof query === 'object' &&
    query !== null &&
    typeof query.keyword === 'string' &&
    query.keyword.trim().length > 0
  )
}
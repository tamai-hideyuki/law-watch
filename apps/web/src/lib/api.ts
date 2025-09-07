const API_BASE_URL = 'http://localhost:3000'

export interface LawData {
  id: string
  name: string
  number: string
  category: string
  status: string
  promulgationDate: string
}

export interface SearchResponse {
  query: string
  totalCount: number
  laws: LawData[]
  executedAt: string
}

export const searchLaws = async (query: string): Promise<SearchResponse> => {
  const encodedQuery = encodeURIComponent(query)
  const response = await fetch(`${API_BASE_URL}/search?q=${encodedQuery}`)
  
  if (!response.ok) {
    throw new Error(`検索に失敗しました: ${response.status}`)
  }
  
  return response.json()
}

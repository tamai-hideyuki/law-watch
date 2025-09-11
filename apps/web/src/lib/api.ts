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
  query?: string
  totalCount: number
  laws: LawData[]
  executedAt: string
}

// 監視機能の型定義を追加
export interface WatchList {
  id: string
  userId: string
  name: string
  lawIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateWatchListResponse {
  success: boolean
  watchList: WatchList
}

export interface AddLawToWatchListResponse {
  success: boolean
  watchList: {
    id: string
    name: string
    lawIds: string[]
    updatedAt: string
  }
}

export interface GetWatchListsResponse {
  success: boolean
  watchLists: WatchList[]
}


export const getAllLaws = async (): Promise<SearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/laws`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch laws: ${response.status}`)
  }
  
  return response.json()
}

export const searchLaws = async (query: string): Promise<SearchResponse> => {
  const encodedQuery = encodeURIComponent(query)
  const response = await fetch(`${API_BASE_URL}/search?q=${encodedQuery}`)
  
  if (!response.ok) {
    throw new Error(`検索に失敗しました: ${response.status}`)
  }
  
  return response.json()
}


// ウォッチリスト作成
export const createWatchList = async (userId: string, name: string) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/watch-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to create watch list: ${response.status}`)
  }
  
  return response.json()
}

// 法令をウォッチリストに追加
export const addLawToWatchList = async (watchListId: string, lawId: string) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/watch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ watchListId, lawId })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to add law to watch list: ${response.status}`)
  }
  
  return response.json()
}

// ユーザーのウォッチリスト取得
export const getUserWatchLists = async (userId: string) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/watch/${userId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get watch lists: ${response.status}`)
  }
  
  return response.json()
}

// 法令をウォッチリストから削除
export const removeLawFromWatchList = async (watchListId: string, lawId: string): Promise<AddLawToWatchListResponse> => {
  const response = await fetch(`${API_BASE_URL}/monitoring/watch/${watchListId}/${lawId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to remove law from watch list: ${response.status}`)
  }
  
  return response.json()
}

// 監視リスト全体削除
export const deleteWatchList = async (watchListId: string, userId: string) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/watch-list/${watchListId}?userId=${userId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to delete watch list: ${response.status}`)
  }
  
  return response.json()
}

// 監視リスト名更新
export const updateWatchListName = async (watchListId: string, userId: string, name: string) => {
  const response = await fetch(`${API_BASE_URL}/monitoring/watch-list/${watchListId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, name })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to update watch list name: ${response.status}`)
  }
  
  return response.json()
}

// 複数法令の一括削除
export const bulkRemoveLaws = async (watchListId: string, lawIds: string[]): Promise<AddLawToWatchListResponse> => {
  const response = await fetch(`${API_BASE_URL}/monitoring/watch/${watchListId}/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lawIds })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to bulk remove laws: ${response.status}`)
  }
  
  return response.json()
}

// ハッシュベース変更検知を実行
export const detectLawChanges = async () => {
  const response = await fetch(`${API_BASE_URL}/monitoring/detect-changes-hash`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to detect law changes: ${response.status}`)
  }
  
  return response.json()
}

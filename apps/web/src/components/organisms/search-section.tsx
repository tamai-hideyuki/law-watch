'use client'

import { SearchForm } from '../molecules/search-form'
import { useSearchLaws } from '../../hooks/use-search-laws'

export const SearchSection = () => {
  const { data, loading, search } = useSearchLaws()

  const handleSearch = async (query: string) => {
    try {
      await search(query)
    } catch (error) {
      console.error('検索エラー:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Law Watch</h1>
        <p className="mt-2 text-gray-600">法的変化の早期発見による社会の安全性向上システム</p>
      </div>
      
      <SearchForm onSearch={handleSearch} loading={loading} />
      
      {data && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">
            「{data.query}」の検索結果: {data.totalCount}件
          </p>
          
          {data.laws.map((law) => (
            <div key={law.id} className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
              <h3 className="font-semibold text-lg text-blue-600">{law.name}</h3>
              <p className="text-gray-600">{law.number}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {law.category}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {law.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

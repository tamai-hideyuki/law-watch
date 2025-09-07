'use client'

import { useAllLaws } from '../../hooks/use-all-laws'

export const LawsList = () => {
  const { data, loading } = useAllLaws()

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-gray-500">法令データを取得中...</div>
      </div>
    )
  }

  if (!data || data.totalCount === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500">法令データが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        全{data.totalCount}件の法令
      </div>
      
      <div className="grid gap-4">
        {data.laws.map((law) => (
          <div key={law.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-blue-600 mb-2">{law.name}</h3>
            <p className="text-gray-600 mb-2">{law.number}</p>
            <div className="flex gap-2">
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
    </div>
  )
}

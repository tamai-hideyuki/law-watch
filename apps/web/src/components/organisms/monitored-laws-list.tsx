'use client'

import type { LawData } from '../../lib/api'

interface MonitoredLawsListProps {
  laws: LawData[]
  onRemove: (law: LawData) => void
}

export const MonitoredLawsList = ({ laws, onRemove }: MonitoredLawsListProps) => {
  if (laws.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">📋</div>
        <p className="text-gray-500">監視対象の法令がありません</p>
        <p className="text-sm text-gray-400 mt-1">
          上の入力欄から法令IDを入力して監視対象を追加してください
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        監視中の法令: {laws.length}件
      </p>
      
      {laws.map((law) => (
        <div key={law.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-blue-600">{law.name}</h3>
              <p className="text-gray-600 text-sm">ID: {law.id}</p>
              <p className="text-gray-600">{law.number}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {law.category}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {law.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                公布日: {new Date(law.promulgationDate).toLocaleDateString('ja-JP')}
              </p>
            </div>
            
            <button
              onClick={() => onRemove(law)}
              className="ml-4 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
            >
              監視解除
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
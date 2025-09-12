'use client'

import { useState } from 'react'
import type { LawData } from '../../lib/api'

interface EnhancedMonitoredLawsListProps {
  laws: LawData[]
  onRemove: (law: LawData) => void
  onBulkRemove: (lawIds: string[]) => void
  loading: boolean
}

export const EnhancedMonitoredLawsList = ({ 
  laws, 
  onRemove, 
  onBulkRemove, 
  loading 
}: EnhancedMonitoredLawsListProps) => {
  const [selectedLaws, setSelectedLaws] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedLaws(new Set())
  }

  const toggleLawSelection = (lawId: string) => {
    const newSelected = new Set(selectedLaws)
    if (newSelected.has(lawId)) {
      newSelected.delete(lawId)
    } else {
      newSelected.add(lawId)
    }
    setSelectedLaws(newSelected)
  }

  const selectAll = () => {
    if (selectedLaws.size === laws.length) {
      setSelectedLaws(new Set())
    } else {
      setSelectedLaws(new Set(laws.map(law => law.id)))
    }
  }

  const handleBulkRemove = () => {
    if (selectedLaws.size === 0) return
    
    if (confirm(`選択した${selectedLaws.size}件の法令を監視対象から削除しますか？`)) {
      onBulkRemove(Array.from(selectedLaws))
      setSelectedLaws(new Set())
      setIsSelectMode(false)
    }
  }

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
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          監視中の法令: {laws.length}件
          {isSelectMode && selectedLaws.size > 0 && (
            <span className="ml-2 text-blue-600">({selectedLaws.size}件選択中)</span>
          )}
        </p>
        
        <div className="flex gap-2">
          {isSelectMode && (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                {selectedLaws.size === laws.length ? '全選択解除' : '全選択'}
              </button>
              <button
                onClick={handleBulkRemove}
                disabled={selectedLaws.size === 0 || loading}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 rounded"
              >
                一括削除 ({selectedLaws.size})
              </button>
            </>
          )}
          <button
            onClick={toggleSelectMode}
            className={`px-3 py-1 text-sm rounded ${
              isSelectMode 
                ? 'bg-gray-200 text-gray-700' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isSelectMode ? '選択終了' : '一括選択'}
          </button>
        </div>
      </div>
      
      {laws.map((law) => (
        <div key={law.id} className={`border rounded-lg p-4 transition-colors ${
          isSelectMode && selectedLaws.has(law.id) 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-gray-50'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3 flex-1">
              {isSelectMode && (
                <input
                  type="checkbox"
                  checked={selectedLaws.has(law.id)}
                  onChange={() => toggleLawSelection(law.id)}
                  className="mt-1"
                />
              )}
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
            </div>
            
            {!isSelectMode && (
              <button
                onClick={() => onRemove(law)}
                disabled={loading}
                className="ml-4 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 rounded text-sm font-medium transition-colors"
              >
                監視解除
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
'use client'

import { useState } from 'react'
import type { WatchList } from '../../lib/api'

interface WatchListManagementProps {
  watchLists: WatchList[]
  onDeleteWatchList: (watchListId: string) => void
  loading: boolean
}

export const WatchListManagement = ({ 
  watchLists, 
  onDeleteWatchList, 
  loading 
}: WatchListManagementProps) => {
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())

  const toggleExpanded = (watchListId: string) => {
    const newExpanded = new Set(expandedLists)
    if (newExpanded.has(watchListId)) {
      newExpanded.delete(watchListId)
    } else {
      newExpanded.add(watchListId)
    }
    setExpandedLists(newExpanded)
  }

  const handleDeleteWatchList = (watchList: WatchList) => {
    if (confirm(`監視リスト「${watchList.name}」を削除しますか？\n含まれる${watchList.lawIds.length}件の法令も監視対象から外れます。`)) {
      onDeleteWatchList(watchList.id)
    }
  }

  if (watchLists.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-lg mb-2">📝</div>
        <p className="text-gray-500">監視リストがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        監視リスト: {watchLists.length}件
      </p>
      
      {watchLists.map((watchList) => (
        <div key={watchList.id} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleExpanded(watchList.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expandedLists.has(watchList.id) ? '▼' : '▶'}
                </button>
                <h3 className="font-semibold text-lg">{watchList.name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {watchList.lawIds.length}件
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-8">
                作成日: {new Date(watchList.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
            
            <button
              onClick={() => handleDeleteWatchList(watchList)}
              disabled={loading}
              className="ml-4 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 rounded text-sm font-medium transition-colors"
            >
              リスト削除
            </button>
          </div>
          
          {expandedLists.has(watchList.id) && (
            <div className="mt-4 ml-8 space-y-2">
              <h4 className="font-medium text-sm text-gray-700">監視中の法令ID:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {watchList.lawIds.map((lawId) => (
                  <div
                    key={lawId}
                    className="px-3 py-2 bg-gray-50 border rounded text-sm font-mono"
                  >
                    {lawId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
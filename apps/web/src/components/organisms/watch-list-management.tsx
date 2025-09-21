'use client'

import { useState } from 'react'
import type { WatchList } from '../../lib/api'

interface WatchListManagementProps {
  watchLists: WatchList[]
  onDeleteWatchList: (watchListId: string) => void
  onUpdateWatchListName: (watchListId: string, newName: string) => void
  loading: boolean
}

export const WatchListManagement = ({ 
  watchLists, 
  onDeleteWatchList,
  onUpdateWatchListName,
  loading 
}: WatchListManagementProps) => {
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

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

  const startEditing = (watchList: WatchList) => {
    setEditingListId(watchList.id)
    setEditingName(watchList.name)
  }

  const cancelEditing = () => {
    setEditingListId(null)
    setEditingName('')
  }

  const saveEditing = (watchListId: string) => {
    if (!editingName.trim()) {
      alert('監視リスト名を入力してください')
      return
    }
    
    if (editingName.trim().length > 100) {
      alert('監視リスト名は100文字以内で入力してください')
      return
    }

    onUpdateWatchListName(watchListId, editingName.trim())
    setEditingListId(null)
    setEditingName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, watchListId: string) => {
    if (e.key === 'Enter') {
      saveEditing(watchListId)
    } else if (e.key === 'Escape') {
      cancelEditing()
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
                {editingListId === watchList.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, watchList.id)}
                      className="font-semibold text-lg bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      maxLength={100}
                    />
                    <button
                      onClick={() => saveEditing(watchList.id)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                      title="保存"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                      title="キャンセル"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <h3 
                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => startEditing(watchList)}
                    title="クリックして編集"
                  >
                    {watchList.name}
                  </h3>
                )}
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
              <h4 className="font-medium text-sm text-gray-700">監視中の法令:</h4>
              <div className="space-y-2">
                {watchList.laws && watchList.laws.length > 0 ? (
                  watchList.laws.map((law) => (
                    <a
                      key={law.id}
                      href={`https://elaws.e-gov.go.jp/document?lawid=${law.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 hover:text-blue-600">
                            {law.name}
                            <svg className="inline-block w-3 h-3 ml-1 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 space-x-3">
                            <span className="font-mono">ID: {law.id}</span>
                            <span>法令番号: {law.number}</span>
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                              {law.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
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
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
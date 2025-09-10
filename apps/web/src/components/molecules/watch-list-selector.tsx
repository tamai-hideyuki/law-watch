'use client'

import { useState } from 'react'
import type { WatchList } from '../../lib/api'

interface WatchListSelectorProps {
  watchLists: WatchList[]
  isOpen: boolean
  onClose: () => void
  onSelect: (watchListId: string) => void
  onCreateNew: (name: string) => void
}

export const WatchListSelector = ({
  watchLists,
  isOpen,
  onClose,
  onSelect,
  onCreateNew
}: WatchListSelectorProps) => {
  const [newListName, setNewListName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  if (!isOpen) return null

  const handleCreateNew = () => {
    if (newListName.trim()) {
      onCreateNew(newListName.trim())
      setNewListName('')
      setShowCreateForm(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">監視リストを選択</h3>
        
        {watchLists.length > 0 && (
          <div className="space-y-2 mb-4">
            {watchLists.map((list) => (
              <button
                key={list.id}
                onClick={() => {
                  onSelect(list.id)
                  onClose()
                }}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">{list.name}</div>
                <div className="text-sm text-gray-500">{list.lawIds.length}件の法令</div>
              </button>
            ))}
          </div>
        )}

        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          >
            + 新しいリストを作成
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="リスト名を入力..."
              className="w-full p-2 border rounded-lg"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateNew}
                disabled={!newListName.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewListName('')
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
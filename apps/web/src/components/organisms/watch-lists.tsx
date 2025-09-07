'use client'

import { useState } from 'react'
import { useWatchLists } from '../../hooks/use-watch-lists'
import { removeLawFromWatchList } from '../../lib/api'

export const WatchLists = () => {
  const { data, loading } = useWatchLists('user-001')
  const [removingLaw, setRemovingLaw] = useState<string | null>(null)

  const handleRemoveLaw = async (watchListId: string, lawId: string) => {
    setRemovingLaw(lawId)
    try {
      await removeLawFromWatchList(watchListId, lawId)
      alert('法令を監視リストから削除しました')
      // ページをリロードして最新状態を取得
      window.location.reload()
    } catch (error) {
      alert('削除に失敗しました')
      console.error(error)
    } finally {
      setRemovingLaw(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-gray-500">監視リストを取得中...</div>
      </div>
    )
  }

  if (!data || data.watchLists.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500">監視中の法令はありません</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {data.watchLists.map((watchList) => (
        <div key={watchList.id} className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="font-semibold text-lg mb-4">{watchList.name}</h3>
          
          {watchList.lawIds.length === 0 ? (
            <p className="text-gray-500">監視中の法令はありません</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">監視中の法令: {watchList.lawIds.length}件</p>
              <div className="space-y-2">
                {watchList.lawIds.map((lawId) => (
                  <div key={lawId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{lawId}</span>
                    <button 
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      onClick={() => handleRemoveLaw(watchList.id, lawId)}
                      disabled={removingLaw === lawId}
                    >
                      {removingLaw === lawId ? '削除中...' : '削除'}
                    </button>
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

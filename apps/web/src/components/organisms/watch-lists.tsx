'use client'

import { useWatchLists } from '../../hooks/use-watch-lists'

export const WatchLists = () => {
  // 仮のユーザーID（認証機能実装後に修正）
  const { data, loading } = useWatchLists('user-001')

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
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      削除
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

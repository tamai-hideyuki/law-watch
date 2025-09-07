'use client'

import { useState, useEffect } from 'react'
import { useAllLaws } from '../../hooks/use-all-laws'
import { Button } from '../atoms/button'
import { addLawToWatchList, getUserWatchLists } from '../../lib/api'

export const LawsList = () => {
  const { data, loading } = useAllLaws()
  const [addingToWatch, setAddingToWatch] = useState<string | null>(null)
  const [availableWatchList, setAvailableWatchList] = useState<string | null>(null)

  // ユーザーのウォッチリストを取得
  useEffect(() => {
    const fetchWatchList = async () => {
      try {
        const watchListsResponse = await getUserWatchLists('user-001')
        if (watchListsResponse.watchLists.length > 0) {
          // 最初のウォッチリストを使用
          setAvailableWatchList(watchListsResponse.watchLists[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch watch lists:', error)
      }
    }
    
    fetchWatchList()
  }, [])

  const handleAddToWatch = async (lawId: string) => {
    if (!availableWatchList) {
      alert('ウォッチリストが見つかりません。先にウォッチリストを作成してください。')
      return
    }

    setAddingToWatch(lawId)
    try {
      await addLawToWatchList(availableWatchList, lawId)
      alert('法令を監視リストに追加しました')
    } catch (error) {
      alert('監視リストへの追加に失敗しました')
      console.error(error)
    } finally {
      setAddingToWatch(null)
    }
  }

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
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {law.category}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {law.status}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddToWatch(law.id)}
                disabled={addingToWatch === law.id || !availableWatchList}
              >
                {addingToWatch === law.id ? '追加中...' : '監視する'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

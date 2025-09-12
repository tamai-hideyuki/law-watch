'use client'

import { useState, useEffect } from 'react'
import { SearchForm } from '../molecules/search-form'
import { WatchListSelector } from '../molecules/watch-list-selector'
import { useSearchLaws } from '../../hooks/use-search-laws'
import { getUserWatchLists, createWatchList, addLawToWatchList, removeLawFromWatchList } from '../../lib/api'
import type { WatchList, LawData } from '../../lib/api'

export const SearchSection = () => {
  const { data, loading, search } = useSearchLaws()
  const [watchLists, setWatchLists] = useState<WatchList[]>([])
  const [watchingLaws, setWatchingLaws] = useState<Set<string>>(new Set())
  const [processingLaw, setProcessingLaw] = useState<string | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [selectedLaw, setSelectedLaw] = useState<LawData | null>(null)
  
  const userId = 'user-001'

  useEffect(() => {
    const fetchWatchLists = async () => {
      try {
        const response = await getUserWatchLists(userId)
        setWatchLists(response.watchLists || [])
        
        // 監視中の法令IDをセットに格納
        const watchedLawIds = new Set<string>()
        response.watchLists?.forEach((list: WatchList) => {
          list.lawIds.forEach(id => watchedLawIds.add(id))
        })
        setWatchingLaws(watchedLawIds)
      } catch (error) {
        console.error('Failed to fetch watch lists:', error)
      }
    }

    fetchWatchLists()
  }, [])

  const handleSearch = async (query: string) => {
    try {
      await search(query)
    } catch (error) {
      console.error('検索エラー:', error)
    }
  }

  const handleToggleWatch = async (law: LawData) => {
    const isWatching = watchingLaws.has(law.id)
    
    if (isWatching) {
      // 監視解除 - 該当する全てのリストから削除
      setProcessingLaw(law.id)
      try {
        const listsWithLaw = watchLists.filter(list => list.lawIds.includes(law.id))
        await Promise.all(
          listsWithLaw.map(list => removeLawFromWatchList(list.id, law.id))
        )
        setWatchingLaws(prev => {
          const newSet = new Set(prev)
          newSet.delete(law.id)
          return newSet
        })
        
        // ウォッチリストデータを更新
        const updatedResponse = await getUserWatchLists(userId)
        setWatchLists(updatedResponse.watchLists || [])
      } catch (err) {
        console.error('Failed to remove from watch:', err)
        alert('監視解除に失敗しました')
      } finally {
        setProcessingLaw(null)
      }
    } else {
      // 監視追加 - リスト選択画面を表示
      setSelectedLaw(law)
      setShowSelector(true)
    }
  }

  const handleWatchListSelect = async (watchListId: string) => {
    if (!selectedLaw) return
    
    setProcessingLaw(selectedLaw.id)
    try {
      await addLawToWatchList(watchListId, selectedLaw.id)
      setWatchingLaws(prev => new Set(prev).add(selectedLaw.id))
      
      // ウォッチリストデータを更新
      const updatedResponse = await getUserWatchLists(userId)
      setWatchLists(updatedResponse.watchLists || [])
    } catch (err) {
      console.error('Failed to add to watch list:', err)
      alert('監視リストへの追加に失敗しました')
    } finally {
      setProcessingLaw(null)
      setSelectedLaw(null)
    }
  }

  const handleCreateNewWatchList = async (name: string) => {
    if (!selectedLaw) return
    
    setProcessingLaw(selectedLaw.id)
    try {
      const response = await createWatchList(userId, name)
      const newWatchList = response.watchList
      
      await addLawToWatchList(newWatchList.id, selectedLaw.id)
      setWatchingLaws(prev => new Set(prev).add(selectedLaw.id))
      setWatchLists(prev => [...prev, newWatchList])
    } catch (err) {
      console.error('Failed to create new watch list:', err)
      alert('新しい監視リストの作成に失敗しました')
    } finally {
      setProcessingLaw(null)
      setSelectedLaw(null)
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
          
          {data.laws.map((law) => {
            const isWatching = watchingLaws.has(law.id)
            const isProcessing = processingLaw === law.id
            
            return (
              <div key={law.id} className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
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
                  
                  <button
                    onClick={() => handleToggleWatch(law)}
                    disabled={isProcessing}
                    className={`ml-4 px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                      isWatching
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {isProcessing ? '処理中...' : isWatching ? '監視解除' : '監視する'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <WatchListSelector
        watchLists={watchLists}
        isOpen={showSelector}
        onClose={() => {
          setShowSelector(false)
          setSelectedLaw(null)
        }}
        onSelect={handleWatchListSelect}
        onCreateNew={handleCreateNewWatchList}
      />
    </div>
  )
}
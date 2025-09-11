'use client'

import { useState, useEffect } from 'react'
import { LawIdInput } from '../molecules/law-id-input'
import { MonitoredLawsList } from '../organisms/monitored-laws-list'
import { WatchListSelector } from '../molecules/watch-list-selector'
import { getAllLaws, getUserWatchLists, createWatchList, addLawToWatchList, removeLawFromWatchList } from '../../lib/api'
import type { WatchList, LawData } from '../../lib/api'

export const MonitoringPage = () => {
  const [monitoredLaws, setMonitoredLaws] = useState<LawData[]>([])
  const [watchLists, setWatchLists] = useState<WatchList[]>([])
  const [loading, setLoading] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [selectedLawId, setSelectedLawId] = useState<string>('')
  
  const userId = 'user-001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [lawsResponse, watchListsResponse] = await Promise.all([
        getAllLaws(),
        getUserWatchLists(userId)
      ])
      
      setMonitoredLaws(lawsResponse.laws || [])
      setWatchLists(watchListsResponse.watchLists || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToMonitoring = async (lawId: string) => {
    if (!lawId.trim()) {
      alert('法令IDを入力してください')
      return
    }

    setSelectedLawId(lawId)
    setShowSelector(true)
  }

  const handleWatchListSelect = async (watchListId: string) => {
    if (!selectedLawId) return
    
    setLoading(true)
    try {
      await addLawToWatchList(watchListId, selectedLawId)
      await loadData() // データを再読み込み
      setSelectedLawId('')
      setShowSelector(false)
      alert('法令が監視対象に追加されました')
    } catch (err) {
      console.error('Failed to add to monitoring:', err)
      alert('監視対象への追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewWatchList = async (name: string) => {
    if (!selectedLawId) return
    
    setLoading(true)
    try {
      const response = await createWatchList(userId, name)
      const newWatchList = response.watchList
      
      await addLawToWatchList(newWatchList.id, selectedLawId)
      await loadData() // データを再読み込み
      setSelectedLawId('')
      setShowSelector(false)
      alert('新しい監視リストが作成され、法令が追加されました')
    } catch (err) {
      console.error('Failed to create new watch list:', err)
      alert('新しい監視リストの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromMonitoring = async (law: LawData) => {
    if (!confirm(`「${law.name}」を監視対象から削除しますか？`)) {
      return
    }

    setLoading(true)
    try {
      const listsWithLaw = watchLists.filter(list => list.lawIds.includes(law.id))
      await Promise.all(
        listsWithLaw.map(list => removeLawFromWatchList(list.id, law.id))
      )
      await loadData() // データを再読み込み
      alert('法令が監視対象から削除されました')
    } catch (err) {
      console.error('Failed to remove from monitoring:', err)
      alert('監視対象からの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Law Watch</h1>
          <p className="mt-2 text-gray-600">法的変化の早期発見による社会の安全性向上システム</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">法令監視対象追加</h2>
            <p className="text-gray-600 mb-4">
              e-Gov法令APIの法令IDを入力して監視対象に追加してください。
              <br />
              法令IDは<a href="https://elaws.e-gov.go.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">e-Gov法令検索</a>で確認できます。
            </p>
            <LawIdInput onSubmit={handleAddToMonitoring} loading={loading} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">監視中の法令</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">読み込み中...</p>
              </div>
            ) : (
              <MonitoredLawsList 
                laws={monitoredLaws} 
                onRemove={handleRemoveFromMonitoring}
              />
            )}
          </div>
        </div>

        <WatchListSelector
          watchLists={watchLists}
          isOpen={showSelector}
          onClose={() => {
            setShowSelector(false)
            setSelectedLawId('')
          }}
          onSelect={handleWatchListSelect}
          onCreateNew={handleCreateNewWatchList}
        />
      </div>
    </div>
  )
}

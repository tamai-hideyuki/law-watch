'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface ComprehensiveMonitoringSetupProps {
  onSetup: (params: ComprehensiveMonitoringParams) => Promise<void>
  isLoading?: boolean
}

export interface ComprehensiveMonitoringParams {
  userId: string
  name: string
  targetCategories?: string[]
  notifyOnNew?: boolean
  notifyOnModified?: boolean
  notifyOnRemoved?: boolean
}

const AVAILABLE_CATEGORIES = [
  '憲法・法律',
  '労働',
  '建築',
  '消費者',
  '環境',
  '交通',
  '金融',
  '医療',
  '教育',
  '税務'
]

export function ComprehensiveMonitoringSetup({ onSetup, isLoading }: ComprehensiveMonitoringSetupProps) {
  const [name, setName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [notifyOnNew, setNotifyOnNew] = useState(true)
  const [notifyOnModified, setNotifyOnModified] = useState(true)
  const [notifyOnRemoved, setNotifyOnRemoved] = useState(true)
  const [error, setError] = useState('')

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('監視設定名を入力してください')
      return
    }

    try {
      await onSetup({
        userId: 'user-001', // 固定値
        name: name.trim(),
        targetCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
        notifyOnNew,
        notifyOnModified,
        notifyOnRemoved
      })

      // 成功時は入力をクリア
      setName('')
      setSelectedCategories([])
      setNotifyOnNew(true)
      setNotifyOnModified(true)
      setNotifyOnRemoved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の作成に失敗しました')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">全法令監視設定</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 監視設定名 */}
        <div>
          <label htmlFor="monitoring-name" className="block text-sm font-medium text-gray-700 mb-2">
            監視設定名 <span className="text-red-500">*</span>
          </label>
          <Input
            id="monitoring-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 全法令総合監視"
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {/* 対象カテゴリ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            監視対象カテゴリ
            <span className="text-sm text-gray-500 ml-2">（未選択の場合は全カテゴリが対象）</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {AVAILABLE_CATEGORIES.map(category => (
              <label
                key={category}
                className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 通知設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            通知する変更種別
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyOnNew}
                onChange={(e) => setNotifyOnNew(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">新規法令の追加</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyOnModified}
                onChange={(e) => setNotifyOnModified(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">既存法令の変更</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyOnRemoved}
                onChange={(e) => setNotifyOnRemoved(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">法令の廃止</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="w-full"
        >
          {isLoading ? '設定中...' : '全法令監視を開始'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">全法令監視について</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 日本の全法令データベースを定期的にチェックし、新規追加・変更・廃止を自動検知します</li>
          <li>• 個別の法令監視とは独立して動作し、法令全体の変化を把握できます</li>
          <li>• 変更検知時には詳細な通知が送信されます</li>
        </ul>
      </div>
    </div>
  )
}
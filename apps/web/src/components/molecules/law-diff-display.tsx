'use client'

import React from 'react'

export interface LawDiffEntry {
  lawId: string
  name: string
  number: string
  category: string
  changeType: 'new' | 'modified' | 'removed' | 'status_changed' | 'category_changed'
  previousValue?: string
  currentValue?: string
  detectedAt: string
}

export interface LawRegistryDiff {
  previousSnapshotId: string
  currentSnapshotId: string
  detectedAt: string
  newLaws: LawDiffEntry[]
  modifiedLaws: LawDiffEntry[]
  removedLaws: LawDiffEntry[]
  summary: {
    totalNew: number
    totalModified: number
    totalRemoved: number
    affectedCategories: string[]
  }
}

interface LawDiffDisplayProps {
  diff: LawRegistryDiff
}

export const LawDiffDisplay: React.FC<LawDiffDisplayProps> = ({ diff }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'new': return 'text-green-600 bg-green-50'
      case 'modified': return 'text-blue-600 bg-blue-50'
      case 'removed': return 'text-red-600 bg-red-50'
      case 'status_changed': return 'text-yellow-600 bg-yellow-50'
      case 'category_changed': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'new': return '新規'
      case 'modified': return '変更'
      case 'removed': return '廃止'
      case 'status_changed': return '状態変更'
      case 'category_changed': return 'カテゴリ変更'
      default: return changeType
    }
  }

  const DiffSection: React.FC<{ title: string; laws: LawDiffEntry[]; icon: string }> = ({ title, laws, icon }) => {
    if (laws.length === 0) return null

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">{icon}</span>
          {title} ({laws.length}件)
        </h3>
        <div className="space-y-3">
          {laws.map((law, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{law.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(law.changeType)}`}>
                  {getChangeTypeLabel(law.changeType)}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div><span className="font-medium">法令番号:</span> {law.number}</div>
                <div><span className="font-medium">カテゴリ:</span> {law.category}</div>
                <div><span className="font-medium">法令ID:</span> <code className="bg-gray-100 px-1 rounded">{law.lawId}</code></div>
                {law.previousValue && law.currentValue && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="mb-2"><span className="font-medium">変更詳細:</span></div>
                    <div className="text-red-600"><span className="font-medium">変更前:</span> {law.previousValue}</div>
                    <div className="text-green-600"><span className="font-medium">変更後:</span> {law.currentValue}</div>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  検知日時: {formatDate(law.detectedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">法令変更差分レポート</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-medium">検知日時:</span> {formatDate(diff.detectedAt)}</div>
            <div><span className="font-medium">前回スナップショット:</span> <code className="bg-white px-1 rounded">{diff.previousSnapshotId}</code></div>
            <div><span className="font-medium">現在スナップショット:</span> <code className="bg-white px-1 rounded">{diff.currentSnapshotId}</code></div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">変更サマリー</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{diff.summary.totalNew}</div>
            <div className="text-sm text-gray-600">新規法令</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{diff.summary.totalModified}</div>
            <div className="text-sm text-gray-600">変更法令</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{diff.summary.totalRemoved}</div>
            <div className="text-sm text-gray-600">廃止法令</div>
          </div>
        </div>
        {diff.summary.affectedCategories.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">影響を受けたカテゴリ:</div>
            <div className="flex flex-wrap gap-2">
              {diff.summary.affectedCategories.map((category, index) => (
                <span key={index} className="px-2 py-1 bg-white rounded-full text-xs border">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <DiffSection title="🆕 新規法令" laws={diff.newLaws} icon="🆕" />
      <DiffSection title="📝 変更法令" laws={diff.modifiedLaws} icon="📝" />
      <DiffSection title="❌ 廃止法令" laws={diff.removedLaws} icon="❌" />

      {diff.summary.totalNew === 0 && diff.summary.totalModified === 0 && diff.summary.totalRemoved === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <div className="text-xl font-medium text-gray-600">変更はありません</div>
          <div className="text-sm text-gray-500 mt-2">前回のスキャンから法令に変更は検出されませんでした</div>
        </div>
      )}
    </div>
  )
}

export default LawDiffDisplay

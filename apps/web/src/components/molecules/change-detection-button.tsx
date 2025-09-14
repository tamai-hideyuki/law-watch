'use client'

import { useState } from 'react'

interface ChangeDetectionResult {
  success: boolean
  message: string
  notifications: Array<{
    id: string
    lawId: string
    changeType: string
    title: string
    description: string
    detectedAt: string
  }>
  executedAt: string
}

interface ChangeDetectionButtonProps {
  onDetectionComplete?: (result: ChangeDetectionResult) => void
}

export const ChangeDetectionButton = ({ onDetectionComplete }: ChangeDetectionButtonProps) => {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<ChangeDetectionResult | null>(null)

  const handleDetectChanges = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/monitoring/detect-changes-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`検知に失敗しました: ${response.status}`)
      }
      
      const result: ChangeDetectionResult = await response.json()
      setLastResult(result)
      
      if (onDetectionComplete) {
        onDetectionComplete(result)
      }
      
      // 結果に応じたメッセージ表示
      if (result.notifications.length > 0) {
        alert(`🚨 ${result.notifications.length}件の法令変更を検出しました！\n\n${result.notifications.map(n => `• ${n.title}`).join('\n')}`)
      } else {
        alert('監視中の法令に変更はありませんでした')
      }
    } catch (error) {
      console.error('Change detection failed:', error)
      alert(`変更検知に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleDetectChanges}
        disabled={loading}
        className={`
          w-full px-6 py-3 rounded-lg font-medium transition-all duration-200
          ${loading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
          }
        `}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            変更を検知中...
          </div>
        ) : (
          '法令変更を検知'
        )}
      </button>
      
      {lastResult && (
        <div className={`
          p-4 rounded-lg border-l-4 
          ${lastResult.notifications.length > 0 
            ? 'bg-yellow-50 border-yellow-400' 
            : 'bg-green-50 border-green-400'
          }
        `}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {lastResult.notifications.length > 0 ? '⚠️' : '✅'}
            </span>
            <p className="font-medium">
              {lastResult.message}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            実行日時: {new Date(lastResult.executedAt).toLocaleString('ja-JP')}
          </p>
          
          {lastResult.notifications.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="font-medium text-sm">検出された変更:</h4>
              {lastResult.notifications.map((notification) => (
                <div key={notification.id} className="bg-white p-3 rounded border">
                  <p className="font-medium text-sm text-red-700">{notification.title}</p>
                  <p className="text-xs text-gray-600">{notification.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    法令ID: {notification.lawId} | 変更種別: {notification.changeType}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

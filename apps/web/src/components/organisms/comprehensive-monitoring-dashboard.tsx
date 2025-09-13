'use client'

import { useState, useEffect } from 'react'
import { ComprehensiveMonitoringSetup, ComprehensiveMonitoringParams } from '../molecules/comprehensive-monitoring-setup'
import { ComprehensiveMonitoringControl } from '../molecules/comprehensive-monitoring-control'
import { NationalLawScanner } from '../molecules/national-law-scanner'

interface ComprehensiveMonitoring {
  id: string
  userId: string
  name: string
  isActive: boolean
  settings: any
  createdAt: string
  updatedAt: string
  lastCheckAt?: string
}

interface ComprehensiveNotification {
  id: string
  monitoringId: string
  userId: string
  title: string
  summary: string
  diff: any
  notificationType: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

const API_BASE_URL = 'http://localhost:3000'

export function ComprehensiveMonitoringDashboard() {
  const [monitorings, setMonitorings] = useState<ComprehensiveMonitoring[]>([])
  const [notifications, setNotifications] = useState<ComprehensiveNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // データ取得
  const fetchData = async () => {
    try {
      const [monitoringResponse, notificationResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/monitoring/watch/user-001`),
        fetch(`${API_BASE_URL}/monitoring/notifications/user-001`)
      ])

      if (monitoringResponse.ok) {
        const monitoringData = await monitoringResponse.json()
        setMonitorings(monitoringData.data || [])
      }

      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json()
        setNotifications(notificationData.data || [])
      }
    } catch (err) {
      console.error('データ取得エラー:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 包括的監視の作成
  const handleSetup = async (params: ComprehensiveMonitoringParams) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/watch-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '設定の作成に失敗しました')
      }

      await fetchData() // データを再取得
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の作成に失敗しました')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 監視実行
  const handleExecuteCheck = async () => {
    const response = await fetch(`${API_BASE_URL}/monitoring/detect-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '監視実行に失敗しました')
    }

    const result = await response.json()
    await fetchData() // 通知データを再取得
    return result.data
  }

  // 変更シミュレート
  const handleSimulateChange = async () => {
    const response = await fetch(`${API_BASE_URL}/monitoring/simulate-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'シミュレーションに失敗しました')
    }
  }

  // 変更リセット
  const handleResetChanges = async () => {
    const response = await fetch(`${API_BASE_URL}/monitoring/reset-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'リセットに失敗しました')
    }
  }

  // 通知を既読にマーク
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        await fetchData() // 通知データを再取得
      }
    } catch (err) {
      console.error('既読マークエラー:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">全法令監視システム</h1>
        <p className="text-gray-600">
          日本の全法令データベースを監視し、新規追加・変更・廃止を自動検知します
        </p>
      </div>

      {/* 全法令スキャナー */}
      <div className="max-w-4xl mx-auto">
        <NationalLawScanner />
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200 max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {/* 現在の監視設定 */}
      {monitorings.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">現在の監視設定</h2>
          <div className="space-y-3">
            {monitorings.map(monitoring => (
              <div
                key={monitoring.id}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-900">{monitoring.name}</h3>
                    <p className="text-sm text-green-700">
                      作成日: {new Date(monitoring.createdAt).toLocaleString('ja-JP')}
                    </p>
                    {monitoring.lastCheckAt && (
                      <p className="text-sm text-green-700">
                        最終チェック: {new Date(monitoring.lastCheckAt).toLocaleString('ja-JP')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      monitoring.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {monitoring.isActive ? '有効' : '無効'}
                    </span>
                  </div>
                </div>
                {monitoring.settings?.targetCategories?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-green-700">
                      対象カテゴリ: {monitoring.settings.targetCategories.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 監視制御 */}
      <ComprehensiveMonitoringControl
        onExecuteCheck={handleExecuteCheck}
        onSimulateChange={handleSimulateChange}
        onResetChanges={handleResetChanges}
        isLoading={isLoading}
      />

      {/* 新規監視設定 */}
      {monitorings.length === 0 && (
        <ComprehensiveMonitoringSetup
          onSetup={handleSetup}
          isLoading={isLoading}
        />
      )}

      {/* 通知一覧 */}
      {notifications.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">監視通知履歴</h2>
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  notification.isRead
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      notification.isRead ? 'text-gray-900' : 'text-blue-900'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      notification.isRead ? 'text-gray-600' : 'text-blue-700'
                    }`}>
                      {new Date(notification.createdAt).toLocaleString('ja-JP')}
                    </p>
                    <div className={`mt-2 text-sm whitespace-pre-line ${
                      notification.isRead ? 'text-gray-700' : 'text-blue-800'
                    }`}>
                      {notification.summary}
                    </div>
                  </div>
                  <div className="ml-4">
                    {!notification.isRead && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monitorings.length === 0 && (
        <div className="text-center p-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">全法令監視を開始しましょう</h3>
          <p className="text-gray-600">
            上記のフォームから全法令監視設定を作成してください
          </p>
        </div>
      )}
    </div>
  )
}
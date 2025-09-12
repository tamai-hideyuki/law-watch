'use client'

import { useState } from 'react'
import { API_BASE_URL } from '../../lib/api'

interface ScanResult {
  scanId?: string
  totalScanned?: number
  changes?: {
    new: number
    revised: number
    abolished: number
    metadata: number
  }
  completedAt?: string
  status?: string
  message?: string
}

export const NationalLawScanner = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  const handleFullScan = async () => {
    setIsScanning(true)
    setError('')
    setScanResult(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/national-tracking/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setScanResult(data.data)
      } else {
        setError(data.error || 'スキャンの開始に失敗しました')
      }
      
    } catch (err) {
      console.error('Full scan error:', err)
      setError('スキャンの実行中にエラーが発生しました')
    } finally {
      setIsScanning(false)
    }
  }

  const handleIncrementalScan = async () => {
    setIsScanning(true)
    setError('')
    setScanResult(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/national-tracking/scan-incremental`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setScanResult(data.data)
      } else {
        setError(data.error || '増分スキャンに失敗しました')
      }
      
    } catch (err) {
      console.error('Incremental scan error:', err)
      setError('増分スキャンの実行中にエラーが発生しました')
    } finally {
      setIsScanning(false)
    }
  }

  const handleCategoryScan = async () => {
    const priorityCategories = [
      '労働基準法',
      '建築基準法', 
      '個人情報保護法',
      '消費者契約法'
    ]
    
    setIsScanning(true)
    setError('')
    setScanResult(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/national-tracking/scan-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categories: priorityCategories })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setScanResult(data.data)
      } else {
        setError(data.error || 'カテゴリスキャンに失敗しました')
      }
      
    } catch (err) {
      console.error('Category scan error:', err)
      setError('カテゴリスキャンの実行中にエラーが発生しました')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">🇯🇵 日本全法令スキャナー</h2>
      <p className="text-gray-600 mb-6 text-sm">
        e-Gov APIから日本の全法令（約8,000件）を取得し、新規制定・改正・廃止を検知します
      </p>
      
      {/* スキャンボタン */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleFullScan}
          disabled={isScanning}
          className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-medium text-blue-900">フルスキャン</div>
          <div className="text-xs text-blue-600 text-center">全法令をチェック<br/>（数分かかります）</div>
        </button>
        
        <button
          onClick={handleIncrementalScan}
          disabled={isScanning}
          className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div className="text-2xl mb-2">⚡</div>
          <div className="font-medium text-green-900">増分スキャン</div>
          <div className="text-xs text-green-600 text-center">前回からの<br/>変更分のみ</div>
        </button>
        
        <button
          onClick={handleCategoryScan}
          disabled={isScanning}
          className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-medium text-purple-900">優先スキャン</div>
          <div className="text-xs text-purple-600 text-center">重要な法令<br/>カテゴリのみ</div>
        </button>
      </div>
      
      {/* ローディング表示 */}
      {isScanning && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-600 font-medium">スキャン実行中...</p>
          <p className="text-gray-500 text-sm">完了まで数分かかる場合があります</p>
        </div>
      )}
      
      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">❌</div>
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        </div>
      )}
      
      {/* スキャン結果表示 */}
      {scanResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">📊 スキャン結果</h3>
          
          {scanResult.status === 'STARTED' ? (
            <div className="text-blue-600">
              <div className="flex items-center mb-2">
                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                {scanResult.message}
              </div>
              <p className="text-sm text-gray-600">
                結果は完了後にページをリフレッシュして確認してください
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scanResult.scanId && (
                <p className="text-xs text-gray-500 mb-2">スキャンID: {scanResult.scanId}</p>
              )}
              
              {scanResult.totalScanned !== undefined && (
                <p className="text-sm">
                  <span className="font-medium">スキャン対象:</span> {scanResult.totalScanned}件の法令
                </p>
              )}
              
              {scanResult.changes && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{scanResult.changes.new}</div>
                    <div className="text-xs text-green-700">新規制定</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-600">{scanResult.changes.revised}</div>
                    <div className="text-xs text-yellow-700">改正</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{scanResult.changes.abolished}</div>
                    <div className="text-xs text-red-700">廃止</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{scanResult.changes.metadata}</div>
                    <div className="text-xs text-blue-700">メタデータ</div>
                  </div>
                </div>
              )}
              
              {scanResult.completedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  完了時刻: {new Date(scanResult.completedAt).toLocaleString('ja-JP')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '../ui/button'

interface ComprehensiveMonitoringControlProps {
  onExecuteCheck: () => Promise<any>
  onSimulateChange: () => Promise<void>
  onResetChanges: () => Promise<void>
  isLoading?: boolean
}

export function ComprehensiveMonitoringControl({
  onExecuteCheck,
  onSimulateChange,
  onResetChanges,
  isLoading
}: ComprehensiveMonitoringControlProps) {
  const [lastResult, setLastResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleExecuteCheck = async () => {
    setIsChecking(true)
    setError('')
    setLastResult(null)

    try {
      const result = await onExecuteCheck()
      setLastResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '監視実行に失敗しました')
    } finally {
      setIsChecking(false)
    }
  }

  const handleSimulateChange = async () => {
    setIsSimulating(true)
    setError('')

    try {
      await onSimulateChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : '変更シミュレーションに失敗しました')
    } finally {
      setIsSimulating(false)
    }
  }

  const handleResetChanges = async () => {
    setIsResetting(true)
    setError('')

    try {
      await onResetChanges()
      setLastResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '変更リセットに失敗しました')
    } finally {
      setIsResetting(false)
    }
  }

  const renderResult = () => {
    if (!lastResult) return null

    if (!lastResult.detectedChanges) {
      return (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-2">✅ 監視実行完了</h3>
          <p className="text-sm text-green-800">法令に変更はありませんでした。</p>
        </div>
      )
    }

    const diff = lastResult.diff
    const summary = diff?.summary

    return (
      <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h3 className="text-sm font-medium text-orange-900 mb-2">🔔 法令変更を検知しました</h3>
        
        {summary && (
          <div className="space-y-2">
            {summary.totalNew > 0 && (
              <div className="text-sm text-orange-800">
                <span className="font-medium">新規法令:</span> {summary.totalNew}件
              </div>
            )}
            {summary.totalModified > 0 && (
              <div className="text-sm text-orange-800">
                <span className="font-medium">変更法令:</span> {summary.totalModified}件
              </div>
            )}
            {summary.totalRemoved > 0 && (
              <div className="text-sm text-orange-800">
                <span className="font-medium">廃止法令:</span> {summary.totalRemoved}件
              </div>
            )}
            {summary.affectedCategories?.length > 0 && (
              <div className="text-sm text-orange-800">
                <span className="font-medium">影響カテゴリ:</span> {summary.affectedCategories.join(', ')}
              </div>
            )}
          </div>
        )}

        {diff && (
          <div className="mt-3 space-y-2">
            {diff.newLaws?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-orange-900 mb-1">新規法令:</h4>
                {diff.newLaws.map((law: any, index: number) => (
                  <div key={index} className="text-xs text-orange-800 ml-2">
                    • {law.name} ({law.category})
                  </div>
                ))}
              </div>
            )}
            {diff.modifiedLaws?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-orange-900 mb-1">変更法令:</h4>
                {diff.modifiedLaws.map((law: any, index: number) => (
                  <div key={index} className="text-xs text-orange-800 ml-2">
                    • {law.name} ({law.category})
                  </div>
                ))}
              </div>
            )}
            {diff.removedLaws?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-orange-900 mb-1">廃止法令:</h4>
                {diff.removedLaws.map((law: any, index: number) => (
                  <div key={index} className="text-xs text-orange-800 ml-2">
                    • {law.name} ({law.category})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">全法令監視制御</h2>
      
      <div className="space-y-4">
        {/* メイン実行ボタン */}
        <div>
          <Button
            onClick={handleExecuteCheck}
            disabled={isLoading || isChecking}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isChecking ? '監視実行中...' : '🔍 全法令変更検知を実行'}
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            全法令データベースをチェックして新規追加・変更・廃止を検知します
          </p>
        </div>

        {/* テスト用コントロール */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">テスト用機能</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleSimulateChange}
              disabled={isLoading || isSimulating}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isSimulating ? 'シミュレート中...' : '📝 変更をシミュレート'}
            </Button>
            <Button
              onClick={handleResetChanges}
              disabled={isLoading || isResetting}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {isResetting ? 'リセット中...' : '🔄 変更をリセット'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            デモ用: 法令変更をシミュレートして監視機能をテストできます
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}

        {renderResult()}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">動作について</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 初回実行時はベースラインスナップショットを作成します</li>
          <li>• 2回目以降の実行で前回との差分を検知します</li>
          <li>• 検知された変更は通知として記録されます</li>
          <li>• 実際の運用では定期実行（cron）による自動監視を推奨します</li>
        </ul>
      </div>
    </div>
  )
}
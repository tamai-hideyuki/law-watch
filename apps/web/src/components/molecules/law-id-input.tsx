'use client'

import { useState } from 'react'

interface LawIdInputProps {
  onSubmit: (lawId: string) => void
  loading?: boolean
}

export const LawIdInput = ({ onSubmit, loading = false }: LawIdInputProps) => {
  const [lawId, setLawId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (lawId.trim() && !loading) {
      onSubmit(lawId.trim())
      setLawId('') // 入力をクリア
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={lawId}
          onChange={(e) => setLawId(e.target.value)}
          placeholder="法令ID (例: 322AC0000000049)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!lawId.trim() || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '追加中...' : '監視対象に追加'}
        </button>
      </div>
      <div className="text-sm text-gray-500">
        <p>法令IDの例:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>322AC0000000049 - 労働基準法</li>
          <li>347AC0000000057 - 労働安全衛生法</li>
          <li>325AC1000000201 - 建築基準法</li>
          <li>412AC0000000061 - 消費者契約法</li>
        </ul>
      </div>
    </form>
  )
}
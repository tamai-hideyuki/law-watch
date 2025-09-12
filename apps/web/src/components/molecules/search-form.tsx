'use client'

import { useState } from 'react'
import { Button, Input } from '../atoms'

interface SearchFormProps {
  onSearch: (query: string) => void
  loading?: boolean
}

export const SearchForm = ({ onSearch, loading = false }: SearchFormProps) => {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="法律名や条文を検索..."
        className="flex-1"
      />
      <Button type="submit" disabled={loading || !query.trim()}>
        {loading ? '検索中...' : '検索'}
      </Button>
    </form>
  )
}

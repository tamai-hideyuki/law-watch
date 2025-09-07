'use client'

import { useState } from 'react'
import { searchLaws, SearchResponse } from '../lib/api'

export const useSearchLaws = () => {
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string) => {
    setLoading(true)
    
    const result = await searchLaws(query)
    setData(result)
    setLoading(false)
  }

  return { data, loading, error, search }
}

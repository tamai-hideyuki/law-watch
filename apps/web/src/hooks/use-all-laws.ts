'use client'

import { useState, useEffect } from 'react'
import { getAllLaws, SearchResponse } from '../lib/api'

export const useAllLaws = () => {
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLaws = async () => {
      const result = await getAllLaws()
      setData(result)
      setLoading(false)
    }
    
    fetchLaws()
  }, [])

  return { data, loading }
}

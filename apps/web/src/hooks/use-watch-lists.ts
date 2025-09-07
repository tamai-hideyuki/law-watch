'use client'

import { useState, useEffect } from 'react'
import { getUserWatchLists, GetWatchListsResponse } from '../lib/api'

export const useWatchLists = (userId: string) => {
  const [data, setData] = useState<GetWatchListsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWatchLists = async () => {
      try {
        const result = await getUserWatchLists(userId)
        setData(result)
      } catch (error) {
        console.error('Failed to fetch watch lists:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWatchLists()
  }, [userId])

  return { data, loading }
}

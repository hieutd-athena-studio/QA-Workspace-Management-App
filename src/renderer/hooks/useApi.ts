import { useState, useEffect, useCallback } from 'react'
import { useInvalidation } from '../contexts/InvalidationContext'

type Domain = 'folders' | 'testCases' | 'testPlans' | 'testCycles' | 'assignments' | 'reports'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  domain?: Domain
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { subscribe } = useInvalidation()

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  // Subscribe to invalidation events
  useEffect(() => {
    if (!domain) return
    return subscribe(domain, refetch)
  }, [domain, subscribe, refetch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unknown error')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, ...deps])

  return { data, loading, error, refetch }
}

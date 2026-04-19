// hooks/useVideoJob.ts
// Polls a video job every 4s while it's pending or processing.

import { useState, useEffect, useCallback, useRef } from 'react'
import type { VideoJob, GeneratedVideo } from '@/types'

interface JobResult {
  job:    VideoJob | null
  videos: GeneratedVideo[]
}

export function useVideoJob(jobId: string | null) {
  const [result,  setResult]  = useState<JobResult>({ job: null, videos: [] })
  const [loading, setLoading] = useState(!!jobId)
  const statusRef             = useRef<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!jobId) return
    try {
      const res  = await fetch(`/api/video/${jobId}`)
      const data = await res.json()
      const updated = { job: data.job ?? null, videos: data.videos ?? [] }
      setResult(updated)
      statusRef.current = data.job?.status ?? null
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (!jobId) return
    fetch_()

    const timer = setInterval(() => {
      const s = statusRef.current
      if (s !== 'pending' && s !== 'processing') {
        clearInterval(timer)
        return
      }
      fetch_()
    }, 4000)

    return () => clearInterval(timer)
  }, [jobId, fetch_])

  return { ...result, loading }
}

// hooks/useEvent.ts
// Fetches a full event dashboard payload and exposes helpers.

import { useState, useEffect, useCallback } from 'react'
import type { EventSummary, Album, EventGuest, MediaWithTags, VideoJob } from '@/types'

interface EventData {
  event:      EventSummary | null
  albums:     Album[]
  guests:     EventGuest[]
  media:      MediaWithTags[]
  video_jobs: VideoJob[]
}

export function useEvent(eventId: string) {
  const [data,    setData]    = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async (opts?: { albumId?: string; category?: string; type?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ event_id: eventId })
      if (opts?.albumId)  params.set('album_id', opts.albumId)
      if (opts?.category) params.set('category', opts.category)
      if (opts?.type)     params.set('type',     opts.type)

      const res  = await fetch(`/api/dashboard?${params}`)
      if (!res.ok) throw new Error('Failed to load event')
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { load() }, [load])

  const removeMedia = useCallback((id: string) => {
    setData(prev => prev ? { ...prev, media: prev.media.filter(m => m.id !== id) } : prev)
  }, [])

  const addJob = useCallback((job: VideoJob) => {
    setData(prev => prev ? { ...prev, video_jobs: [job, ...prev.video_jobs] } : prev)
  }, [])

  return { data, loading, error, reload: load, removeMedia, addJob }
}

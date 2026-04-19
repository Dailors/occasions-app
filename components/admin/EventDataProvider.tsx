// components/admin/EventDataProvider.tsx
'use client'
import { useEffect } from 'react'
import { useEventStore } from '@/lib/store'
import { useRealtime } from '@/hooks/useRealtime'

interface EventDataProviderProps {
  eventId:  string
  children: React.ReactNode
}

export function EventDataProvider({ eventId, children }: EventDataProviderProps) {
  const setData    = useEventStore(s => s.setData)
  const setLoading = useEventStore(s => s.setLoading)
  const setEventId = useEventStore(s => s.setEventId)

  useRealtime(eventId)

  useEffect(() => {
    // Wipe stale data immediately when eventId changes
    setData({ event: null, albums: [], guests: [], media: [], videoJobs: [] })
    setEventId(eventId)

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/dashboard?event_id=${eventId}`)
        const data = await res.json()
        if (cancelled) return
        setData({
          event:      data.event      ?? null,
          albums:     data.albums     ?? [],
          guests:     data.guests     ?? [],
          media:      data.media      ?? [],
          videoJobs:  data.video_jobs ?? [],
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // Reset on unmount so the next event starts clean
    return () => {
      cancelled = true
      setData({ event: null, albums: [], guests: [], media: [], videoJobs: [] })
      setLoading(false)
    }
  }, [eventId, setData, setLoading, setEventId])

  return <>{children}</>
}

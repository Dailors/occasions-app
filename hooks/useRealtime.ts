// hooks/useRealtime.ts
// Subscribes to Supabase Realtime for live media inserts and video job updates.
// Uses a ref to avoid stale closure on the media array.

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEventStore } from '@/lib/store'
import type { MediaWithTags, VideoJob } from '@/types'

export function useRealtime(eventId: string) {
  const upsertJob = useEventStore(s => s.upsertJob)
  const setData   = useEventStore(s => s.setData)

  // Ref so callbacks always see the latest media without re-subscribing
  const mediaRef = useRef(useEventStore.getState().media)
  useEffect(() => {
    // subscribe returns the unsubscribe function — return it directly for cleanup
    return useEventStore.subscribe(s => { mediaRef.current = s.media })
  }, [])

  useEffect(() => {
    if (!eventId) return
    const supabase = createClient()

    // Live media inserts
    const mediaChannel = supabase
      .channel(`media:${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'media', filter: `event_id=eq.${eventId}` },
        async (payload) => {
          const row = payload.new as any
          const { data: signed } = await supabase.storage
            .from('media-originals')
            .createSignedUrl(row.url_original, 60 * 60 * 24 * 7)

          const newItem: MediaWithTags = {
            ...row,
            preview_url:   signed?.signedUrl ?? null,
            category:      null,
            emotion:       null,
            quality_score: null,
            raw_tags:      null,
          }

          // Use ref so we always prepend to the current array, not a stale snapshot
          setData({ media: [newItem, ...mediaRef.current] })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'media_tags' },
        (payload) => {
          const tag = payload.new as any
          const updated = mediaRef.current.map(m =>
            m.id === tag.media_id
              ? { ...m, category: tag.category, emotion: tag.emotion, quality_score: tag.quality_score, raw_tags: tag.raw_tags }
              : m
          )
          setData({ media: updated })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'media_tags' },
        (payload) => {
          const tag = payload.new as any
          const updated = mediaRef.current.map(m =>
            m.id === tag.media_id
              ? { ...m, category: tag.category, emotion: tag.emotion, quality_score: tag.quality_score, raw_tags: tag.raw_tags }
              : m
          )
          setData({ media: updated })
        }
      )
      .subscribe()

    // Video job status changes
    const jobChannel = supabase
      .channel(`video_jobs:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_jobs', filter: `event_id=eq.${eventId}` },
        (payload) => { if (payload.new) upsertJob(payload.new as VideoJob) }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(mediaChannel)
      supabase.removeChannel(jobChannel)
    }
  }, [eventId, upsertJob, setData])
}

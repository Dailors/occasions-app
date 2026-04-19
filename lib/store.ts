// lib/store.ts
// Global state using Zustand.
// Keeps event data, media, and job state in sync across all dashboard tabs.

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { EventSummary, MediaWithTags, VideoJob, Album, EventGuest } from '@/types'

interface EventStore {
  eventId:    string | null
  event:      EventSummary | null
  albums:     Album[]
  guests:     EventGuest[]
  media:      MediaWithTags[]
  videoJobs:  VideoJob[]
  loading:    boolean
  mediaFilter: {
    category:    string
    emotion:     string
    type:        string
    uploader_id: string
  }

  setEventId:  (id: string) => void
  setData:     (data: Partial<Omit<EventStore, 'setEventId' | 'setData' | 'removeMedia' | 'upsertJob' | 'setFilter' | 'setLoading'>>) => void
  removeMedia: (id: string) => void
  upsertJob:   (job: VideoJob) => void
  setFilter:   (key: keyof EventStore['mediaFilter'], value: string) => void
  setLoading:  (v: boolean) => void
}

export const useEventStore = create<EventStore>()(
  immer((set) => ({
    eventId:    null,
    event:      null,
    albums:     [],
    guests:     [],
    media:      [],
    videoJobs:  [],
    loading:    false,
    mediaFilter: { category: '', emotion: '', type: '', uploader_id: '' },

    setEventId: (id) => set(s => { s.eventId = id }),

    setData: (data) => set(s => {
      Object.assign(s, data)
    }),

    removeMedia: (id) => set(s => {
      s.media = s.media.filter(m => m.id !== id)
      if (s.event) s.event.media_count = Math.max(0, (s.event.media_count ?? 1) - 1)
    }),

    upsertJob: (job) => set(s => {
      const idx = s.videoJobs.findIndex(j => j.id === job.id)
      if (idx >= 0) s.videoJobs[idx] = job
      else s.videoJobs.unshift(job)
    }),

    setFilter: (key, value) => set(s => {
      s.mediaFilter[key] = value
    }),

    setLoading: (v) => set(s => { s.loading = v }),
  }))
)

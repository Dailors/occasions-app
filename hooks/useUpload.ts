// hooks/useUpload.ts
// Manages a file upload queue with per-file status tracking.

import { useState, useCallback } from 'react'

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error'

export interface UploadEntry {
  tempId:      string
  file:        File
  status:      UploadStatus
  preview_url: string | null
  media_id:    string | null
  error?:      string
}

export function useUpload(eventId: string, albumId: string) {
  const [queue, setQueue] = useState<UploadEntry[]>([])

  const updateEntry = (tempId: string, patch: Partial<UploadEntry>) => {
    setQueue(prev => prev.map(e => e.tempId === tempId ? { ...e, ...patch } : e))
  }

  const upload = useCallback(async (files: File[]) => {
    const entries: UploadEntry[] = files.map(file => ({
      tempId:      `${Date.now()}-${Math.random()}`,
      file,
      status:      'queued',
      preview_url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      media_id:    null,
    }))

    setQueue(prev => [...entries, ...prev])

    // Process in batches of 3
    for (let i = 0; i < entries.length; i += 3) {
      const batch = entries.slice(i, i + 3)
      await Promise.allSettled(
        batch.map(async (entry) => {
          updateEntry(entry.tempId, { status: 'uploading' })
          try {
            const fd = new FormData()
            fd.append('file',     entry.file)
            fd.append('event_id', eventId)
            fd.append('album_id', albumId)

            const res  = await fetch('/api/upload', { method: 'POST', body: fd })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error ?? 'Upload failed')

            updateEntry(entry.tempId, {
              status:      'done',
              media_id:    data.media.id,
              preview_url: data.media.preview_url ?? entry.preview_url,
            })
          } catch (err: any) {
            updateEntry(entry.tempId, { status: 'error', error: err.message })
          }
        })
      )
    }
  }, [eventId, albumId])

  const clear = useCallback(() => setQueue([]), [])

  const retry = useCallback(async (tempId: string) => {
    const entry = queue.find(e => e.tempId === tempId)
    if (!entry) return

    // Reset status to uploading in place — don't add a duplicate to the queue
    setQueue(prev => prev.map(e => e.tempId === tempId ? { ...e, status: 'uploading' as const } : e))

    try {
      const fd = new FormData()
      fd.append('file',     entry.file)
      fd.append('event_id', eventId)
      fd.append('album_id', albumId)
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setQueue(prev => prev.map(e =>
        e.tempId === tempId
          ? { ...e, status: 'done' as const, media_id: data.media.id, preview_url: data.media.preview_url ?? e.preview_url }
          : e
      ))
    } catch {
      setQueue(prev => prev.map(e => e.tempId === tempId ? { ...e, status: 'error' as const } : e))
    }
  }, [queue, eventId, albumId])

  const counts = {
    total:     queue.length,
    done:      queue.filter(e => e.status === 'done').length,
    uploading: queue.filter(e => e.status === 'uploading').length,
    error:     queue.filter(e => e.status === 'error').length,
  }

  return { queue, upload, clear, retry, counts }
}

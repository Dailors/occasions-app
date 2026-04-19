// components/admin/Lightbox.tsx
// Full-screen media viewer. Opens when admin clicks a media item.
// Shows photo or video with metadata and re-tag button.

'use client'
import { useEffect, useState } from 'react'
import {
  X, ChevronLeft, ChevronRight, Star,
  Tag, RefreshCw, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Card'
import { categoryLabel, emotionEmoji, formatBytes, formatDate } from '@/lib/utils'
import type { MediaWithTags } from '@/types'
import toast from 'react-hot-toast'

interface LightboxProps {
  media:    MediaWithTags[]
  startId:  string | null
  onClose:  () => void
  onDelete: (id: string) => void
}

export function Lightbox({ media, startId, onClose, onDelete }: LightboxProps) {
  const [currentId, setCurrentId] = useState(startId)
  const [retagging, setRetagging] = useState(false)

  const idx     = media.findIndex(m => m.id === currentId)
  const current = media[idx] ?? null

  const prev = () => setCurrentId(media[Math.max(0, idx - 1)].id)
  const next = () => setCurrentId(media[Math.min(media.length - 1, idx + 1)].id)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   prev()
      if (e.key === 'ArrowRight')  next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx])

  const handleRetag = async () => {
    if (!current) return
    setRetagging(true)
    try {
      const res = await fetch(`/api/media/${current.id}/tag`, { method: 'POST' })
      if (!res.ok) throw new Error('Re-tag failed')
      toast.success('Media re-tagged')
    } catch {
      toast.error('Re-tag failed')
    } finally {
      setRetagging(false)
    }
  }

  const handleDelete = async () => {
    if (!current || !confirm('Delete this file?')) return
    try {
      const res = await fetch(`/api/media/${current.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDelete(current.id)
      if (media.length <= 1) { onClose(); return }
      setCurrentId(media[Math.max(0, idx - 1)].id)
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  if (!current) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/90 backdrop-blur-sm">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev / Next */}
      {idx > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {idx < media.length - 1 && (
        <button
          onClick={next}
          className="absolute right-64 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Media viewer */}
      <div className="flex-1 flex items-center justify-center p-8 pr-72">
        {current.type === 'photo' && current.preview_url ? (
          <img
            key={current.id}
            src={current.preview_url}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl animate-fade-in"
          />
        ) : current.type === 'video' && current.preview_url ? (
          <video
            key={current.id}
            src={current.preview_url}
            controls
            className="max-w-full max-h-full rounded-xl animate-fade-in"
          />
        ) : (
          <div className="text-white/40 text-sm">No preview available</div>
        )}
      </div>

      {/* Metadata panel */}
      <div className="w-64 bg-white h-full flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">{idx + 1} of {media.length}</p>
          <p className="text-sm font-medium text-gray-900 capitalize">{current.type}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(current.uploaded_at, 'dd MMM yyyy · HH:mm')}</p>
        </div>

        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* AI tags */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> AI tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {current.category && (
                <Badge color="brand">{categoryLabel(current.category)}</Badge>
              )}
              {current.emotion && (
                <Badge color="gray">{emotionEmoji(current.emotion)} {current.emotion}</Badge>
              )}
              {current.quality_score != null && (
                <Badge color="gray">
                  <Star className="w-3 h-3 inline mr-0.5 fill-yellow-400 text-yellow-400" />
                  {current.quality_score.toFixed(2)}
                </Badge>
              )}
              {!current.category && !current.emotion && (
                <p className="text-xs text-gray-400">Not yet tagged</p>
              )}
            </div>
          </div>

          {/* File info */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">File info</p>
            <p className="text-xs text-gray-600">{formatBytes(current.file_size)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          {current.type === 'photo' && (
            <Button
              variant="secondary"
              size="sm"
              loading={retagging}
              onClick={handleRetag}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-tag with AI
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

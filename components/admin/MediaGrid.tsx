// components/admin/MediaGrid.tsx
'use client'
import { useState } from 'react'
import { Trash2, Star, Film, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Lightbox } from './Lightbox'
import { categoryLabel, emotionEmoji, formatBytes } from '@/lib/utils'
import type { MediaWithTags } from '@/types'
import toast from 'react-hot-toast'

interface MediaGridProps {
  media:     MediaWithTags[]
  onDelete?: (id: string) => void
}

const CATEGORY_OPTIONS = [
  { value: '',         label: 'All categories' },
  { value: 'couple',   label: 'Couple'         },
  { value: 'family',   label: 'Family'         },
  { value: 'ceremony', label: 'Ceremony'       },
  { value: 'dance',    label: 'Dance / Party'  },
  { value: 'venue',    label: 'Venue'          },
]

const EMOTION_OPTIONS = [
  { value: '',          label: 'All emotions' },
  { value: 'happy',     label: '😊 Happy'     },
  { value: 'emotional', label: '🥹 Emotional' },
  { value: 'energetic', label: '🎉 Energetic' },
  { value: 'neutral',   label: '😐 Neutral'   },
]

const TYPE_OPTIONS = [
  { value: '',      label: 'Photos & Videos' },
  { value: 'photo', label: 'Photos only'     },
  { value: 'video', label: 'Videos only'     },
]

export function MediaGrid({ media, onDelete }: MediaGridProps) {
  const [category, setCategory] = useState('')
  const [emotion,  setEmotion]  = useState('')
  const [type,     setType]     = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const filtered = media.filter(m => {
    if (category && m.category !== category) return false
    if (emotion  && m.emotion  !== emotion)  return false
    if (type     && m.type     !== type)     return false
    return true
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      onDelete?.(id)
      toast.success('File deleted')
    } catch {
      toast.error('Could not delete file')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select options={CATEGORY_OPTIONS} value={category} onChange={e => setCategory(e.target.value)} className="w-44" />
        <Select options={EMOTION_OPTIONS}  value={emotion}  onChange={e => setEmotion(e.target.value)}  className="w-40" />
        <Select options={TYPE_OPTIONS}     value={type}     onChange={e => setType(e.target.value)}     className="w-40" />
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} of {media.length} files</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No media matches this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(m => (
            <div
              key={m.id}
              onClick={() => setLightbox(m.id)}
              className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square cursor-pointer ring-2 ring-transparent hover:ring-brand-400 transition-all"
            >
              {m.preview_url ? (
                m.type === 'photo' ? (
                  <img
                    src={m.preview_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video src={m.preview_url} className="w-full h-full object-cover" muted preload="metadata" />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {m.type === 'video'
                    ? <Film className="w-6 h-6 text-gray-400" />
                    : <ImageIcon className="w-6 h-6 text-gray-400" />
                  }
                </div>
              )}

              {m.type === 'video' && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">VIDEO</span>
                </div>
              )}

              {m.quality_score != null && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                  {m.quality_score.toFixed(1)}
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />

              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                  disabled={deleting === m.id}
                  className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          media={filtered}
          startId={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={(id) => { onDelete?.(id); setLightbox(null) }}
        />
      )}
    </div>
  )
}

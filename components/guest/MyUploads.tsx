// components/guest/MyUploads.tsx
// Shows the current guest's uploads beneath the upload zone.
// Pulls media where uploader_id = current user — RLS enforces this automatically.

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, Film, Trash2, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MyUpload {
  id:          string
  type:        string
  url_original: string
  uploaded_at: string
  preview_url: string | null
}

interface MyUploadsProps {
  eventId: string
}

export function MyUploads({ eventId }: MyUploadsProps) {
  const [uploads,  setUploads]  = useState<MyUpload[]>([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('media')
        .select('id, type, url_original, uploaded_at')
        .eq('event_id', eventId)
        .order('uploaded_at', { ascending: false })

      if (!data) { setLoading(false); return }

      // Sign URLs
      const paths = data.map(m => m.url_original)
      const { data: signed } = await supabase.storage
        .from('media-originals')
        .createSignedUrls(paths, 60 * 60 * 24)

      const urlMap: Record<string, string> = {}
      for (const s of signed ?? []) {
        if (s.signedUrl) urlMap[s.path] = s.signedUrl
      }

      setUploads(data.map(m => ({
        ...m,
        preview_url: urlMap[m.url_original] ?? null,
      })))
      setLoading(false)
    }

    load()

    // Live updates — new uploads appear instantly
    const channel = supabase
      .channel(`my-uploads:${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'media',
        filter: `event_id=eq.${eventId}`,
      }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this file?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setUploads(prev => prev.filter(u => u.id !== id))
      toast.success('File removed')
    } catch {
      toast.error('Could not remove file')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    )
  }

  if (uploads.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Your uploads ({uploads.length})
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {uploads.map(u => (
          <div key={u.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
            {u.preview_url ? (
              u.type === 'photo' ? (
                <img
                  src={u.preview_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={u.preview_url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {u.type === 'video'
                  ? <Film className="w-5 h-5 text-gray-400" />
                  : <ImageIcon className="w-5 h-5 text-gray-400" />
                }
              </div>
            )}

            {/* Overlay with delete */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-end p-1.5">
              <button
                onClick={() => handleDelete(u.id)}
                disabled={deleting === u.id}
                className="p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
              >
                {deleting === u.id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Trash2 className="w-3 h-3" />
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

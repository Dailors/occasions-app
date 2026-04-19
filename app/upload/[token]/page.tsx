// app/upload/[token]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { UploadZone } from '@/components/guest/UploadZone'
import { MyUploads } from '@/components/guest/MyUploads'
import { OfflineIndicator } from '@/components/guest/OfflineIndicator'
import { Sparkles, CalendarDays, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EventInfo {
  album:  { id: string; name: string; type: string }
  event:  { id: string; couple_names: string; wedding_date: string | null }
}

export default function GuestUploadPage() {
  const { token }                       = useParams<{ token: string }>()
  const [info,     setInfo]             = useState<EventInfo | null>(null)
  const [error,    setError]            = useState<string | null>(null)
  const [loading,  setLoading]          = useState(true)
  const [myUploads, setMyUploads]       = useState(0)

  useEffect(() => {
    fetch('/api/join-album', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ access_token: token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInfo(data)
      })
      .catch(() => setError('Could not load this event. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse-slow">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-red-400" />
        </div>
        <h1 className="font-serif text-xl font-semibold text-gray-900">Link unavailable</h1>
        <p className="text-sm text-gray-500 max-w-xs">{error}</p>
      </div>
    )
  }

  if (!info) return null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <OfflineIndicator />
      {/* Header */}
      <div className="bg-gradient-to-b from-brand-500 to-brand-600 text-white px-6 pt-10 pb-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg font-medium opacity-90">Occasions</span>
          </div>

          <h1 className="font-serif text-2xl font-semibold mb-1">
            {info.event.couple_names}
          </h1>

          <div className="flex items-center gap-4 text-sm text-white/70">
            {info.event.wedding_date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(info.event.wedding_date)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              {info.album.name}
            </span>
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="flex-1 px-6 py-6 max-w-md mx-auto w-full">
        <div className="mb-5">
          <h2 className="font-medium text-gray-900 mb-1">Share your photos & videos</h2>
          <p className="text-sm text-gray-500">
            Upload as many as you like. Only you can see your own uploads — the couple will receive everything privately.
          </p>
        </div>

        <UploadZone
          eventId={info.event.id}
          albumId={info.album.id}
        />

        {/* Privacy note */}
        <div className="mt-6 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            Your uploads are private. Other guests cannot see your photos or videos. Only the couple has access to the full collection.
          </p>
        </div>

        <MyUploads eventId={info.event.id} />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-300">Powered by Occasions</p>
      </div>
    </div>
  )
}

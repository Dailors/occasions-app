// app/dashboard/[eventId]/qr/page.tsx
// Printable page with all 3 album QR codes.
// Reads albums from the Zustand store — no extra fetch needed.

'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useEventStore } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Printer, Sparkles } from 'lucide-react'
import { buildUploadUrl, albumTypeLabel, formatDate } from '@/lib/utils'
import type { Album } from '@/types'

const ALBUM_ICONS: Record<string, string> = {
  mixed: '📸',
  men:   '🤵',
  women: '👰',
}

export default function PrintQRPage() {
  const { eventId }           = useParams<{ eventId: string }>()
  const event                 = useEventStore(s => s.event)
  const albums                = useEventStore(s => s.albums)
  const storeLoading          = useEventStore(s => s.loading)
  const [qrs,    setQrs]      = useState<Record<string, string>>({})
  const [qrLoad, setQrLoad]   = useState(false)

  // Fetch QR SVGs once albums are available
  useEffect(() => {
    if (albums.length === 0) return
    setQrLoad(true)
    Promise.all(
      albums.map(async (album: Album) => {
        const r   = await fetch(`/api/albums/${album.id}/qr?format=svg`)
        const svg = await r.text()
        return [album.id, svg] as const
      })
    ).then(entries => {
      setQrs(Object.fromEntries(entries))
      setQrLoad(false)
    })
  }, [albums.map(a => a.id).join(',')])

  const loading = storeLoading || qrLoad

  return (
    <div className="min-h-screen bg-white">
      {/* Print button */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 print:hidden">
        <span className="text-sm text-gray-500">Print QR codes for your venue</span>
        <Button onClick={() => window.print()} size="sm" className="gap-1.5">
          <Printer className="w-3.5 h-3.5" />
          Print
        </Button>
      </div>

      {/* Printable sheet */}
      <div className="max-w-3xl mx-auto px-8 py-12 print:py-6 print:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <span className="font-serif text-lg text-brand-600">Occasions</span>
          </div>
          {loading && !event ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-56 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl font-semibold text-gray-900">
                {event?.couple_names ?? ''}
              </h1>
              {event?.wedding_date && (
                <p className="text-gray-500 mt-1">{formatDate(event.wedding_date)}</p>
              )}
            </>
          )}
          <p className="text-sm text-gray-400 mt-3">
            Scan a QR code below to share your photos and videos
          </p>
        </div>

        {/* QR grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 print:grid-cols-3">
          {loading && albums.length === 0
            ? [0,1,2].map(i => (
                <div key={i} className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-gray-100">
                  <Skeleton className="h-8 w-8" rounded="full" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-44 w-44" rounded="lg" />
                </div>
              ))
            : albums.map(album => (
                <div key={album.id} className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-gray-100 print:border-gray-200">
                  <span className="text-3xl">{ALBUM_ICONS[album.type] ?? '📷'}</span>
                  <h3 className="font-semibold text-gray-900 text-center">{album.name}</h3>
                  <p className="text-xs text-gray-500 text-center">{albumTypeLabel(album.type)}</p>

                  {qrs[album.id] ? (
                    <div className="w-44 h-44" dangerouslySetInnerHTML={{ __html: qrs[album.id] }} />
                  ) : (
                    <Skeleton className="w-44 h-44" rounded="lg" />
                  )}

                  <p className="text-[10px] text-gray-400 text-center break-all font-mono">
                    {buildUploadUrl(album.access_token)}
                  </p>
                </div>
              ))
          }
        </div>

        <div className="text-center mt-12 print:mt-8">
          <p className="text-xs text-gray-300">
            Your uploads are private · Only the couple sees the full gallery · Powered by Occasions
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 1cm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

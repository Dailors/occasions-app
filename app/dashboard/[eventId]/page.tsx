// app/dashboard/[eventId]/page.tsx
'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEventStore } from '@/lib/store'
import { AlbumCard } from '@/components/admin/AlbumCard'
import { DownloadAll } from '@/components/admin/DownloadAll'
import { Card, Badge } from '@/components/ui/Card'
import { StatsSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { CalendarDays, ImageIcon, Film, QrCode, Printer } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const loading     = useEventStore(s => s.loading)
  const event       = useEventStore(s => s.event)
  const albums      = useEventStore(s => s.albums)
  const media       = useEventStore(s => s.media)

  if (loading && !event) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <StatsSkeleton />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0,1,2].map(i => <Skeleton key={i} className="h-32 w-full" rounded="lg" />)}
        </div>
      </div>
    )
  }

  if (!event) return null

  const stats = [
    { label: 'Total files', value: event.media_count ?? media.length },
    { label: 'Photos',      value: event.photo_count ?? 0            },
    { label: 'Videos',      value: event.video_count ?? 0            },
    { label: 'Guests',      value: event.guest_count ?? 0            },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-2xl font-semibold text-gray-900">{event.couple_names}</h1>
            <Badge color={event.status === 'active' ? 'green' : 'gray'}>{event.status}</Badge>
          </div>
          {event.wedding_date && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(event.wedding_date)}
            </div>
          )}
        </div>
        <DownloadAll eventId={eventId} total={event.media_count ?? media.length} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} padding="sm" className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">{s.label}</span>
            <span className="text-2xl font-semibold text-gray-900">{s.value}</span>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-gray-400" />
            Upload links & QR codes
          </h2>
          <Link
            href={`/dashboard/${eventId}/qr`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print all QR codes
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {albums.map(album => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/${eventId}/media`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ImageIcon className="w-4 h-4" />
          View all media
        </Link>
        <Link
          href={`/dashboard/${eventId}/videos`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Film className="w-4 h-4" />
          Generate videos
        </Link>
      </div>
    </div>
  )
}

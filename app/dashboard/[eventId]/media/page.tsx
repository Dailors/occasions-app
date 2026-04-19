// app/dashboard/[eventId]/media/page.tsx
'use client'
import { useParams } from 'next/navigation'
import { useEventStore } from '@/lib/store'
import { MediaGrid } from '@/components/admin/MediaGrid'
import { DownloadAll } from '@/components/admin/DownloadAll'
import { RetagButton } from '@/components/admin/RetagButton'
import { MediaGridSkeleton } from '@/components/ui/Skeleton'

export default function MediaPage() {
  const { eventId }    = useParams<{ eventId: string }>()
  const loading        = useEventStore(s => s.loading)
  const media          = useEventStore(s => s.media)
  const event          = useEventStore(s => s.event)
  const removeMedia    = useEventStore(s => s.removeMedia)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Media</h1>
          <p className="text-sm text-gray-500 mt-1">
            All photos and videos from every guest, tagged by AI.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <RetagButton eventId={eventId} />
          <DownloadAll eventId={eventId} total={event?.media_count ?? media.length} />
        </div>
      </div>

      {loading ? (
        <MediaGridSkeleton count={15} />
      ) : (
        <MediaGrid media={media} onDelete={removeMedia} />
      )}
    </div>
  )
}

// app/dashboard/[eventId]/videos/page.tsx
'use client'
import { useParams } from 'next/navigation'
import { useEventStore } from '@/lib/store'
import { TemplateSelector } from '@/components/admin/TemplateSelector'
import { VideoJobCard } from '@/components/admin/VideoJobCard'
import { SocialPanel } from '@/components/admin/SocialPanel'
import { Card } from '@/components/ui/Card'
import { VideoJobSkeleton } from '@/components/ui/Skeleton'
import { Sparkles, Video } from 'lucide-react'

export default function VideosPage() {
  const { eventId }  = useParams<{ eventId: string }>()
  const loading      = useEventStore(s => s.loading)
  const videoJobs    = useEventStore(s => s.videoJobs)
  const upsertJob    = useEventStore(s => s.upsertJob)

  const handleJobCreated = async (jobId: string, templateId: string) => {
    upsertJob({
      id:               jobId,
      event_id:         eventId,
      template_id:      templateId,
      status:           'pending',
      segment_map:      null,
      error_message:    null,
      created_at:       new Date().toISOString(),
      completed_at:     null,
      generated_videos: [],
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Videos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate cinematic wedding videos from your guests' uploads.
        </p>
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <h2 className="font-medium text-gray-900">Generate new video</h2>
            <p className="text-xs text-gray-500">Pick a template — AI maps your media to each scene.</p>
          </div>
        </div>
        <TemplateSelector eventId={eventId} onJobCreated={handleJobCreated} />
      </Card>

      <SocialPanel eventId={eventId} />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-4 h-4 text-gray-400" />
          <h2 className="font-medium text-gray-900">Generated videos</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <VideoJobSkeleton key={i} />)}
          </div>
        ) : videoJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Video className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No videos generated yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoJobs.map(job => (
              <VideoJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

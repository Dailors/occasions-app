// components/admin/VideoJobCard.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { Download, Loader2, CheckCircle2, XCircle, Clock, Clapperboard } from 'lucide-react'
import { Card, Badge } from '@/components/ui/Card'
import { useEventStore } from '@/lib/store'
import { getTemplate } from '@/lib/templates'
import { formatDate } from '@/lib/utils'
import type { VideoJob } from '@/types'

interface VideoJobCardProps {
  job: VideoJob
}

const FORMAT_LABELS: Record<string, string> = {
  highlight:   '🎬 Wedding Highlight',
  reel:        '📱 Instagram Reel',
  status_clip: '💬 WhatsApp Status',
}

function templateName(id: string): string {
  return getTemplate(id)?.name ?? id.replace(/_/g, ' ') ?? 'Wedding video'
}

export function VideoJobCard({ job: initial }: VideoJobCardProps) {
  const [job, setJob]   = useState(initial)
  const upsertJob       = useEventStore(s => s.upsertJob)

  const poll = useCallback(async () => {
    const res  = await fetch(`/api/video/${job.id}`)
    const data = await res.json()
    if (data.job) {
      const updated = { ...data.job, generated_videos: data.videos ?? [] }
      setJob(updated)
      upsertJob(updated)
    }
  }, [job.id, upsertJob])

  useEffect(() => {
    if (job.status !== 'pending' && job.status !== 'processing') return
    const timer = setInterval(poll, 4000)
    return () => clearInterval(timer)
  }, [job.status, poll])

  const StatusIcon = {
    pending:    Clock,
    processing: Loader2,
    done:       CheckCircle2,
    failed:     XCircle,
  }[job.status] ?? Clock

  const iconClass = {
    pending:    'text-yellow-500',
    processing: 'text-blue-500 animate-spin',
    done:       'text-green-500',
    failed:     'text-red-500',
  }[job.status] ?? ''

  const statusColor = {
    pending:    'yellow',
    processing: 'blue',
    done:       'green',
    failed:     'red',
  }[job.status] as 'yellow' | 'blue' | 'green' | 'red'

  return (
    <Card padding="sm" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Clapperboard className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {templateName(job.template_id)}
            </p>
            <p className="text-xs text-gray-400">
              {formatDate(job.created_at, 'dd MMM yyyy · HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusIcon className={`w-4 h-4 ${iconClass}`} />
          <Badge color={statusColor}>{job.status}</Badge>
        </div>
      </div>

      {job.status === 'failed' && job.error_message && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {job.error_message}
        </p>
      )}

      {(job.status === 'pending' || job.status === 'processing') && (
        <div className="space-y-1.5">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-400 rounded-full animate-pulse w-2/3" />
          </div>
          <p className="text-xs text-gray-400 text-center">Rendering your wedding video…</p>
        </div>
      )}

      {job.status === 'done' && (job.generated_videos ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          {(job.generated_videos ?? []).map((v: any) => (
            <a
              key={v.id}
              href={v.download_url ?? '#'}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <span className="text-sm text-gray-700">{FORMAT_LABELS[v.format] ?? v.format}</span>
              <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors" />
            </a>
          ))}
        </div>
      )}
    </Card>
  )
}

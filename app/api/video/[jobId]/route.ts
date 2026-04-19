// app/api/video/[jobId]/route.ts
// Admin polls this to check render progress and get download links.

import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { jobId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: job, error } = await supabase
    .from('video_jobs')
    .select(`
      id, template_id, status, segment_map, error_message, created_at, completed_at,
      generated_videos(id, format, url, file_size, created_at),
      events!inner(admin_id)
    `)
    .eq('id', params.jobId)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const event = job.events as any
  if (event?.admin_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Sign download URLs for completed videos
  const videos = await Promise.all(
    ((job.generated_videos as any[]) ?? []).map(async (v) => {
      const { data: signed } = await supabase.storage
        .from('generated-videos')
        .createSignedUrl(v.url, 60 * 60 * 24 * 7)
      return { ...v, download_url: signed?.signedUrl ?? null }
    })
  )

  return NextResponse.json({
    job: {
      id:            job.id,
      template_id:   job.template_id,
      status:        job.status,
      error_message: job.error_message,
      created_at:    job.created_at,
      completed_at:  job.completed_at,
    },
    videos,
  })
}

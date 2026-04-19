// app/api/video/generate/route.ts
// Admin triggers video generation for an event.
// 1. Creates a video_job row
// 2. Fetches all tagged media
// 3. Runs AI segment mapper
// 4. Kicks off FFmpeg render
// 5. Saves generated_videos rows

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getTemplate } from '@/lib/templates'
import { mapMediaToTemplate } from '@/lib/ai/mapper'
import { renderVideo } from '@/lib/video/renderer'
import { generateSocialContent } from '@/lib/ai/social'

export const maxDuration = 300  // 5 minutes — video rendering is slow

export async function POST(req: NextRequest) {
  const supabase      = createRouteClient()
  const supabaseAdmin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, template_id } = await req.json()
  if (!event_id || !template_id) {
    return NextResponse.json({ error: 'event_id and template_id required' }, { status: 400 })
  }

  // Verify admin owns this event
  const { data: event } = await supabase
    .from('events')
    .select('id, couple_names, wedding_date')
    .eq('id', event_id)
    .eq('admin_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Load template
  const template = getTemplate(template_id)
  if (!template) return NextResponse.json({ error: 'Unknown template' }, { status: 400 })

  // Create job row (status: pending)
  const { data: job, error: jobError } = await supabaseAdmin
    .from('video_jobs')
    .insert({ event_id, template_id, status: 'pending' })
    .select()
    .single()

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

  // Run async — respond immediately with job ID so client can poll
  ;(async () => {
    try {
      // Update status: processing
      await supabaseAdmin
        .from('video_jobs')
        .update({ status: 'processing' })
        .eq('id', job.id)

      // Fetch all tagged media for this event
      const { data: media } = await supabaseAdmin
        .from('media_with_tags')
        .select('*')
        .eq('event_id', event_id)

      if (!media || media.length === 0) throw new Error('No media found for this event')

      // AI mapping: assign best media to each template segment
      const segmentMap = mapMediaToTemplate(template.segments, media)

      // Save segment map to job
      await supabaseAdmin
        .from('video_jobs')
        .update({ segment_map: segmentMap })
        .eq('id', job.id)

      // Render video
      const results = await renderVideo(template, segmentMap, media, event_id, job.id)

      // Save generated video rows
      for (const r of results) {
        await supabaseAdmin.from('generated_videos').insert({
          job_id:    job.id,
          format:    r.format,
          url:       r.storagePath,
          file_size: r.fileSizeBytes,
        })
      }

      // Generate social content
      await generateSocialContent(event.couple_names, event.wedding_date)

      // Mark job done
      await supabaseAdmin
        .from('video_jobs')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', job.id)

    } catch (err: any) {
      console.error('Video generation failed:', err)
      await supabaseAdmin
        .from('video_jobs')
        .update({ status: 'failed', error_message: err?.message ?? 'Unknown error' })
        .eq('id', job.id)
    }
  })()

  return NextResponse.json({ job_id: job.id, status: 'pending' }, { status: 202 })
}

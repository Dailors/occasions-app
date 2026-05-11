// app/api/video/status/[jobId]/route.ts
// Polls Creatomate for render status, updates DB when done.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { jobId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const supabase = createRouteClient()
    const admin = createServiceRoleClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch job
    const { data: job } = await admin
      .from('video_jobs').select('*, events!inner(admin_id)')
      .eq('id', params.jobId).single()
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // Verify ownership
    if ((job as any).events?.admin_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // If already done, return saved URL
    if (job.status === 'done') {
      const { data: generated } = await admin
        .from('generated_videos').select('url, format')
        .eq('job_id', job.id)
      return NextResponse.json({
        status: 'done',
        videos: generated ?? [],
      })
    }

    if (job.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: job.error_message })
    }

    // Poll Creatomate
    const creatomateId = (job.segment_map as any)?.creatomate_render_id
    if (!creatomateId) {
      return NextResponse.json({ status: job.status })
    }

    const apiKey = process.env.CREATOMATE_API_KEY
    if (!apiKey) return NextResponse.json({ status: job.status })

    const res = await fetch(`https://api.creatomate.com/v1/renders/${creatomateId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      return NextResponse.json({ status: job.status })
    }

    const data = await res.json()

    if (data.status === 'succeeded' && data.url) {
      // Save URL
      await admin.from('generated_videos').upsert({
        job_id: job.id,
        format: 'reel',
        url: data.url,
      }, { onConflict: 'job_id' })
      await admin.from('video_jobs').update({
        status: 'done',
        completed_at: new Date().toISOString(),
      }).eq('id', job.id)
      return NextResponse.json({
        status: 'done',
        videos: [{ format: 'reel', url: data.url }],
      })
    }

    if (data.status === 'failed') {
      await admin.from('video_jobs').update({
        status: 'failed',
        error_message: data.error ?? 'Render failed',
      }).eq('id', job.id)
      return NextResponse.json({ status: 'failed', error: data.error })
    }

    // Still rendering
    return NextResponse.json({
      status: 'processing',
      progress: data.progress ?? null,
    })
  } catch (err: any) {
    console.error('Status check error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

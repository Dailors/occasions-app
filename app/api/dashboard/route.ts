// app/api/dashboard/route.ts
import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase       = createRouteClient()
  const { searchParams } = new URL(req.url)
  const event_id       = searchParams.get('event_id')
  const album_id       = searchParams.get('album_id')
  const category       = searchParams.get('category')
  const uploader_id    = searchParams.get('uploader_id')
  const media_type     = searchParams.get('type')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  // Event list
  const { data: events } = await supabase
    .from('event_summary')
    .select('*')
    .order('wedding_date', { ascending: true })

  if (!event_id) return NextResponse.json({ events })

  // Verify ownership
  const { data: ownedEvent } = await supabase
    .from('events')
    .select('id')
    .eq('id', event_id)
    .eq('admin_id', user.id)
    .single()

  if (!ownedEvent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Media with tags
  let mq = supabase
    .from('media_with_tags')
    .select('*')
    .eq('event_id', event_id)
    .order('uploaded_at', { ascending: false })

  if (album_id)   mq = mq.eq('album_id',    album_id)
  if (category)   mq = mq.eq('category',    category)
  if (uploader_id) mq = mq.eq('uploader_id', uploader_id)
  if (media_type)  mq = mq.eq('type',         media_type)

  const { data: media } = await mq

  // Sign preview URLs
  const paths = (media ?? []).map(m => m.url_original).filter(Boolean)
  let urlMap: Record<string, string> = {}
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from('media-originals')
      .createSignedUrls(paths, 60 * 60 * 24 * 7)
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) urlMap[s.path] = s.signedUrl
    }
  }

  const mediaWithUrls = (media ?? []).map(m => ({
    ...m,
    preview_url: urlMap[m.url_original] ?? null,
  }))

  // Albums
  const { data: albums } = await supabase
    .from('albums')
    .select('*')
    .eq('event_id', event_id)

  // Guests
  const { data: guests } = await supabase
    .from('event_guests')
    .select('*, profiles(full_name, avatar_url)')
    .eq('event_id', event_id)
    .order('joined_at')

  // Video jobs + outputs
  const { data: videoJobs } = await supabase
    .from('video_jobs')
    .select('*, generated_videos(*)')
    .eq('event_id', event_id)
    .order('created_at', { ascending: false })

  // Sign video download URLs
  const videoPaths = ((videoJobs ?? []) as any[])
    .flatMap(j => j.generated_videos ?? [])
    .map((v: any) => v.url)
    .filter(Boolean)

  let videoUrlMap: Record<string, string> = {}
  if (videoPaths.length) {
    const { data: sv } = await supabase.storage
      .from('generated-videos')
      .createSignedUrls(videoPaths, 60 * 60 * 24 * 7)
    for (const s of sv ?? []) {
      if (s.signedUrl && s.path) videoUrlMap[s.path] = s.signedUrl
    }
  }

  const jobsWithUrls = (videoJobs ?? []).map((j: any) => ({
    ...j,
    generated_videos: (j.generated_videos ?? []).map((v: any) => ({
      ...v,
      download_url: videoUrlMap[v.url] ?? null,
    })),
  }))

  return NextResponse.json({
    event:      (events ?? []).find((e: any) => e.id === event_id) ?? null,
    albums:     albums ?? [],
    guests:     guests ?? [],
    media:      mediaWithUrls,
    video_jobs: jobsWithUrls,
  })
}

// app/api/events/[eventId]/download/route.ts
// Admin downloads ALL media for an event as a ZIP file.
// Streams the zip using JSZip + Supabase Storage signed URLs.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { eventId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase      = createRouteClient()
  const supabaseAdmin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('id, couple_names')
    .eq('id', params.eventId)
    .eq('admin_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get all media rows (service role bypasses RLS to get everything)
  const { data: media } = await supabaseAdmin
    .from('media')
    .select('id, url_original, type, uploaded_at')
    .eq('event_id', params.eventId)
    .order('uploaded_at')

  if (!media || media.length === 0) {
    return NextResponse.json({ error: 'No media to download' }, { status: 404 })
  }

  // Sign all URLs (1h — enough to zip and download)
  const paths = media.map(m => m.url_original)
  const { data: signed } = await supabaseAdmin.storage
    .from('media-originals')
    .createSignedUrls(paths, 60 * 60)

  if (!signed) return NextResponse.json({ error: 'Could not generate download URLs' }, { status: 500 })

  const urlMap: Record<string, string> = {}
  for (const s of signed) {
    if (s.signedUrl) urlMap[s.path] = s.signedUrl
  }

  // Build a JSON response with all signed URLs — client fetches them directly.
  // For a true server-side zip, you'd use a background job with a proper compute environment.
  // This approach is more practical for Vercel's 10s function limit.
  const files = media.map(m => ({
    name: m.url_original.split('/').pop() ?? m.id,
    url:  urlMap[m.url_original] ?? null,
    type: m.type,
  })).filter(f => f.url)

  return NextResponse.json({
    couple_names: event.couple_names,
    total:        files.length,
    files,
  })
}

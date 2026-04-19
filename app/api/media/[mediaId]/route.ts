// app/api/media/[mediaId]/route.ts
// GET    → refresh signed URL for a single media item
// DELETE → admin or uploader can delete

import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { mediaId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: media, error } = await supabase
    .from('media')
    .select('id, url_original, url_compressed, type, uploaded_at')
    .eq('id', params.mediaId)
    .single()

  if (error || !media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: signed } = await supabase.storage
    .from('media-originals')
    .createSignedUrl(media.url_original, 60 * 60 * 24 * 7) // 7 days

  return NextResponse.json({ ...media, preview_url: signed?.signedUrl ?? null })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the media row — RLS will only return it if user is uploader or event admin
  const { data: media, error } = await supabase
    .from('media')
    .select('id, url_original, url_compressed, event_id')
    .eq('id', params.mediaId)
    .single()

  if (error || !media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Remove from storage
  const toDelete = [media.url_original, media.url_compressed].filter(Boolean) as string[]
  if (toDelete.length) {
    await supabase.storage.from('media-originals').remove(toDelete)
  }

  // Delete DB row (cascades to media_tags)
  await supabase.from('media').delete().eq('id', params.mediaId)

  return NextResponse.json({ success: true })
}

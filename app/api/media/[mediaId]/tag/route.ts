// app/api/media/[mediaId]/tag/route.ts
// POST — force re-tag a single media item with the AI tagger.
// Useful if tagging failed silently during upload.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { tagMedia } from '@/lib/ai/tagger'

type Params = { params: { mediaId: string } }

export async function POST(_: NextRequest, { params }: Params) {
  const supabase      = createRouteClient()
  const supabaseAdmin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch media — RLS ensures only admin or uploader can access
  const { data: media } = await supabase
    .from('media')
    .select('id, url_original, type, event_id')
    .eq('id', params.mediaId)
    .single()

  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (media.type !== 'photo') {
    return NextResponse.json({ error: 'Only photos can be re-tagged' }, { status: 400 })
  }

  // Download from storage
  const { data: fileData, error: dlError } = await supabaseAdmin.storage
    .from('media-originals')
    .download(media.url_original)

  if (dlError || !fileData) {
    return NextResponse.json({ error: 'Could not download media' }, { status: 500 })
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())
  const b64    = buffer.toString('base64')

  // Re-tag
  const tags = await tagMedia(b64)

  // Upsert tag row
  await supabaseAdmin
    .from('media_tags')
    .upsert(
      {
        media_id:      params.mediaId,
        category:      tags.category,
        emotion:       tags.emotion,
        quality_score: tags.quality_score,
        raw_tags:      tags.raw_tags,
        tagged_at:     new Date().toISOString(),
      },
      { onConflict: 'media_id' }
    )

  return NextResponse.json({ success: true, tags })
}

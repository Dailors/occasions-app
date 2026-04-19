// app/api/events/[eventId]/retag/route.ts
// POST — finds all media with no tag row and re-tags them with the AI tagger.
// Admin only. Returns a stream of progress so the client can show a status count.
// Each photo is tagged; videos are skipped (no frame extraction yet).

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { tagMedia } from '@/lib/ai/tagger'

type Params = { params: { eventId: string } }

export async function POST(_: NextRequest, { params }: Params) {
  const supabase      = createRouteClient()
  const supabaseAdmin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', params.eventId)
    .eq('admin_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Find all photos with no tag yet
  const { data: untagged } = await supabaseAdmin
    .from('media')
    .select('id, url_original, type')
    .eq('event_id', params.eventId)
    .eq('type', 'photo')
    .not('id', 'in', `(SELECT media_id FROM media_tags WHERE media_id IS NOT NULL)`)

  if (!untagged || untagged.length === 0) {
    return NextResponse.json({ tagged: 0, message: 'All media already tagged' })
  }

  let tagged = 0
  let failed = 0

  for (const item of untagged) {
    try {
      const { data: fileData } = await supabaseAdmin.storage
        .from('media-originals')
        .download(item.url_original)

      if (!fileData) { failed++; continue }

      const buffer = Buffer.from(await fileData.arrayBuffer())
      const b64    = buffer.toString('base64')
      const tags   = await tagMedia(b64)

      await supabaseAdmin.from('media_tags').upsert(
        {
          media_id:      item.id,
          category:      tags.category,
          emotion:       tags.emotion,
          quality_score: tags.quality_score,
          raw_tags:      tags.raw_tags,
          tagged_at:     new Date().toISOString(),
        },
        { onConflict: 'media_id' }
      )
      tagged++
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    total:   untagged.length,
    tagged,
    failed,
  })
}

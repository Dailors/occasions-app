// app/api/upload/route.ts
// Guest uploads file(s). Accepts both original + optional compressed preview.
// Saves both. Fires background tagging. Fast response to client.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const admin = createServiceRoleClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const form = await req.formData()
    const original = form.get('file') as File                  // original file
    const compressed = form.get('compressed') as File | null   // optional compressed preview
    const albumId = form.get('album_id') as string
    const eventId = form.get('event_id') as string

    if (!original) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!albumId) return NextResponse.json({ error: 'No album_id' }, { status: 400 })
    if (!eventId) return NextResponse.json({ error: 'No event_id' }, { status: 400 })

    // Verify membership
    const { data: membership } = await admin
      .from('event_guests').select('id')
      .eq('user_id', user.id).eq('event_id', eventId).eq('album_id', albumId)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this album. Reload and retry.' }, { status: 403 })
    }

    const type: 'photo' | 'video' = original.type.startsWith('video') ? 'video' : 'photo'
    const ext = original.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const rand = Math.random().toString(36).slice(2, 8)
    const basePath = `${eventId}/${user.id}/${timestamp}-${rand}`
    const originalPath = `${basePath}.${ext}`
    const compressedPath = compressed ? `${basePath}-c.jpg` : null

    // Upload original
    const originalBuf = Buffer.from(await original.arrayBuffer())
    const { error: uploadError } = await admin.storage
      .from('media-originals')
      .upload(originalPath, originalBuf, { contentType: original.type, upsert: false })

    if (uploadError) {
      console.error('Original upload failed:', uploadError)
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
    }

    // Upload compressed preview if provided
    if (compressed && compressedPath) {
      const compressedBuf = Buffer.from(await compressed.arrayBuffer())
      const { error: compErr } = await admin.storage
        .from('media-compressed')
        .upload(compressedPath, compressedBuf, { contentType: 'image/jpeg', upsert: false })
      if (compErr) console.error('Compressed upload failed (non-fatal):', compErr)
    }

    // Insert media row
    const { data: media, error: insertError } = await admin.from('media').insert({
      event_id: eventId,
      album_id: albumId,
      uploader_id: user.id,
      type,
      url_original: originalPath,
      url_compressed: compressedPath,
      file_size: original.size,
    }).select().single()

    if (insertError) {
      console.error('Media row insert failed:', insertError)
      return NextResponse.json({ error: 'Database insert failed: ' + insertError.message }, { status: 500 })
    }

    // Fire background tagging (photos + videos)
    const origin = req.nextUrl.origin
    fetch(`${origin}/api/tag-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: media.id }),
    }).catch(err => console.error('Background tag failed:', err))

    return NextResponse.json({ media })
  } catch (err: any) {
    console.error('upload error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

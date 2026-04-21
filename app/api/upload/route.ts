// app/api/upload/route.ts
// Receives a file from a guest and stores it in Supabase Storage.
// Then inserts a media row pointing to the file.

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
    const file = form.get('file') as File
    const albumId = form.get('album_id') as string
    const eventId = form.get('event_id') as string

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!albumId) return NextResponse.json({ error: 'No album_id' }, { status: 400 })
    if (!eventId) return NextResponse.json({ error: 'No event_id' }, { status: 400 })

    // Verify guest is part of this album
    const { data: membership } = await admin
      .from('event_guests')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('album_id', albumId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this album. Please reload and try again.' }, { status: 403 })
    }

    // Determine media type
    const type: 'photo' | 'video' = file.type.startsWith('video') ? 'video' : 'photo'

    // Build file path: event_id/uploader_id/filename
    const ext = file.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const path = `${eventId}/${user.id}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Upload to media-originals bucket
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await admin
      .storage.from('media-originals')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload to storage failed:', uploadError)
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
    }

    // Insert media row
    const { data: media, error: insertError } = await admin.from('media').insert({
      event_id: eventId,
      album_id: albumId,
      uploader_id: user.id,
      type,
      url_original: path,
      file_size: file.size,
    }).select().single()

    if (insertError) {
      console.error('Media row insert failed:', insertError)
      return NextResponse.json({ error: 'Database insert failed: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({ media })
  } catch (err: any) {
    console.error('upload error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

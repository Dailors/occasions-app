// app/api/upload/route.ts
import { createRouteClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { tagMedia } from '@/lib/ai/tagger'
import { checkRateLimit } from '@/lib/ratelimit'

export const maxDuration = 60   // seconds — override Vercel default

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB

export async function POST(req: NextRequest) {
  const supabase    = createRouteClient()
  const supabaseAdmin = createServiceRoleClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Rate limit: 100 uploads per user per hour
  const rl = checkRateLimit(user.id)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Upload limit reached. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(Math.ceil(rl.resetAt / 1000)),
          'Retry-After':           String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  const formData = await req.formData()
  const file     = formData.get('file')     as File | null
  const event_id = formData.get('event_id') as string | null
  const album_id = formData.get('album_id') as string | null

  if (!file || !event_id || !album_id) {
    return NextResponse.json({ error: 'Missing file, event_id, or album_id' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 200 MB)' }, { status: 413 })
  }

  const isPhoto = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  if (!isPhoto && !isVideo) {
    return NextResponse.json({ error: 'Only images and videos are allowed' }, { status: 415 })
  }

  // Verify guest access
  const { data: guestAccess } = await supabase
    .from('event_guests')
    .select('id')
    .eq('event_id', event_id)
    .eq('album_id', album_id)
    .eq('user_id', user.id)
    .single()

  if (!guestAccess) {
    return NextResponse.json({ error: 'No access to this album' }, { status: 403 })
  }

  const ext         = file.name.split('.').pop() ?? (isPhoto ? 'jpg' : 'mp4')
  const fileName    = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${event_id}/${user.id}/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('media-originals')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (storageError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: mediaRow, error: insertError } = await supabase
    .from('media')
    .insert({
      event_id,
      album_id,
      uploader_id:   user.id,
      type:          isPhoto ? 'photo' : 'video',
      url_original:  storagePath,
      file_size:     file.size,
    })
    .select('id, type, url_original, uploaded_at')
    .single()

  if (insertError) {
    await supabase.storage.from('media-originals').remove([storagePath])
    return NextResponse.json({ error: 'Could not save upload record' }, { status: 500 })
  }

  // Async AI tagging — don't block the response
  if (isPhoto) {
    const b64 = Buffer.from(arrayBuffer).toString('base64')
    tagMedia(b64, file.type as any)
      .then(async (tags) => {
        await supabaseAdmin.from('media_tags').insert({
          media_id:      mediaRow.id,
          category:      tags.category,
          emotion:       tags.emotion,
          quality_score: tags.quality_score,
          raw_tags:      tags.raw_tags,
        })
      })
      .catch(err => console.error('Tagging failed for', mediaRow.id, err))
  }

  const { data: signedUrl } = await supabase.storage
    .from('media-originals')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

  return NextResponse.json({
    media: {
      id:          mediaRow.id,
      type:        mediaRow.type,
      preview_url: signedUrl?.signedUrl ?? null,
      uploaded_at: mediaRow.uploaded_at,
    },
  }, { status: 201 })
}

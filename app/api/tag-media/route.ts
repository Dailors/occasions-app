// app/api/tag-media/route.ts
// Analyzes media with Claude Haiku 4.5 Vision.
// Rate limited per user to prevent abuse.

import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { media_id } = await req.json()
    if (!media_id) return NextResponse.json({ error: 'media_id required' }, { status: 400 })

    const admin = createServiceRoleClient()

    const { data: media, error: mediaError } = await admin
      .from('media').select('*').eq('id', media_id).single()
    if (mediaError || !media) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

    // Rate limit by uploader
    const rate = await checkRateLimit(media.uploader_id, 'tag_media')
    if (!rate.allowed) {
      // Silently skip — this is background work, just don't tag
      return NextResponse.json({ skipped: true, reason: 'rate limit' })
    }

    const { data: existing } = await admin
      .from('media_tags').select('id').eq('media_id', media_id).maybeSingle()
    if (existing) return NextResponse.json({ skipped: true, reason: 'already tagged' })

    const bucket = media.url_compressed ? 'media-compressed' : 'media-originals'
    const path = media.url_compressed ?? media.url_original

    if (media.type === 'video' && !media.url_compressed) {
      await admin.from('media_tags').insert({
        media_id, category: null, emotion: 'energetic',
        quality_score: 0.5, raw_tags: { note: 'video no keyframe' },
      })
      return NextResponse.json({ ok: true, fallback: true })
    }

    const { data: signed } = await admin.storage.from(bucket).createSignedUrl(path, 300)
    if (!signed?.signedUrl) return NextResponse.json({ error: 'Could not get URL' }, { status: 500 })

    const imgRes = await fetch(signed.signedUrl)
    if (!imgRes.ok) return NextResponse.json({ error: 'Could not fetch' }, { status: 500 })

    const buf = Buffer.from(await imgRes.arrayBuffer())
    const base64 = buf.toString('base64')
    const ctype = imgRes.headers.get('content-type') || 'image/jpeg'
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const finalType = allowed.includes(ctype) ? ctype : 'image/jpeg'

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const isVideo = media.type === 'video'

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: finalType as any, data: base64 } },
          {
            type: 'text',
            text: `${isVideo ? 'Keyframe from a wedding/event video.' : 'Wedding/event photo.'} Respond ONLY valid JSON, no markdown:
{
  "category": "couple" | "family" | "ceremony" | "dance" | "venue",
  "emotion": "happy" | "emotional" | "energetic" | "neutral",
  "quality_score": 0.0 to 1.0,
  "has_faces": true or false,
  "people_count": number,
  "description": "one sentence"
}`
          }
        ]
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    let parsed: any
    try { parsed = JSON.parse(cleaned) }
    catch { return NextResponse.json({ error: 'Parse failed' }, { status: 500 }) }

    const { error: insertErr } = await admin.from('media_tags').insert({
      media_id,
      category: parsed.category ?? null,
      emotion: parsed.emotion ?? null,
      quality_score: typeof parsed.quality_score === 'number' ? parsed.quality_score : 0.5,
      raw_tags: parsed,
    })
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, tags: parsed })
  } catch (err: any) {
    console.error('Tagger error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown' }, { status: 500 })
  }
}

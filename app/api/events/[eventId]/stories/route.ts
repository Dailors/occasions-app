// app/api/events/[eventId]/stories/route.ts
// Generates AI packages (story/post/photo_dump/video).
// Always generates 2 of the requested kind.
// Max 6 total per kind (2 initial + 3 regenerations × 2).

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

type Params = { params: { eventId: string } }
type Kind = 'story' | 'post' | 'photo_dump' | 'video'

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: packages } = await supabase
    .from('story_packages').select('*').eq('event_id', params.eventId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ packages: packages ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const admin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const kind: Kind = body.kind ?? 'story'
  const count: number = 2  // always 2 per request

  const { data: event } = await supabase
    .from('events').select('id, couple_names').eq('id', params.eventId).eq('admin_id', user.id).single()
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check limit: max 6 total per kind
  const { count: existing } = await admin
    .from('story_packages').select('id', { count: 'exact', head: true })
    .eq('event_id', params.eventId).eq('format', kind)
  if ((existing ?? 0) >= 6) {
    return NextResponse.json({ error: `Max reached for ${kind}. Delete some to make more.` }, { status: 400 })
  }

  // Get best media
  const { data: media } = await admin
    .from('media_with_tags').select('*')
    .eq('event_id', params.eventId).eq('type', 'photo')
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(50)

  if (!media || media.length < 4) {
    return NextResponse.json({ error: 'Need at least 4 photos' }, { status: 400 })
  }

  const photosPerPackage: Record<Kind, number> = {
    story: 1, post: 1, photo_dump: 8, video: 12,
  }
  const per = photosPerPackage[kind]

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const results: any[] = []

  for (let i = 0; i < count; i++) {
    // Pick distinct media
    const offset = (existing ?? 0) + i * per
    const selected = media.slice(offset % media.length, (offset % media.length) + per)
    if (selected.length === 0) continue

    const promptByKind: Record<Kind, string> = {
      story:      'a 4-word emotional Instagram Story caption',
      post:       'a 2-sentence Instagram post caption that feels warm and personal, plus 5 hashtags',
      photo_dump: 'a casual 1-sentence photo dump caption, plus 3 hashtags',
      video:      'a short title (3-5 words) for a cinematic wedding highlight video',
    }

    try {
      const msg = await client.messages.create({
        model: 'claude-opus-4-5-20250929',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Event: "${event.couple_names}". Write ${promptByKind[kind]}. Variation ${(existing ?? 0) + i + 1}.
Return ONLY JSON: {"caption_en":"...","caption_ar":"...","hashtags":["..."]}`
        }]
      })

      const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
      let parsed: any = {}
      try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) } catch {}

      const { data: pkg } = await admin.from('story_packages').insert({
        event_id:   params.eventId,
        format:     kind,
        variant:    (existing ?? 0) + i + 1,
        media_ids:  selected.map((m: any) => m.id),
        caption_en: parsed.caption_en ?? '',
        caption_ar: parsed.caption_ar ?? '',
        hashtags:   parsed.hashtags ?? [],
        status:     'ready',
      }).select().single()

      if (pkg) results.push(pkg)
    } catch (err) {
      console.error('Gen failed:', err)
    }
  }

  return NextResponse.json({ packages: results })
}

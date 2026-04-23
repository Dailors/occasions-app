// app/api/events/[eventId]/stories/route.ts
// AI content generator with rate limiting + manager lockout.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

type Params = { params: { eventId: string } }
type Kind = 'story' | 'post' | 'photo_dump' | 'video'

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleClient()

  // Verify user is the host
  const { data: event } = await admin
    .from('events').select('admin_id').eq('id', params.eventId).single()
  if (!event || event.admin_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data: packages } = await admin
    .from('story_packages').select('*')
    .eq('event_id', params.eventId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ packages: packages ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const supabase = createRouteClient()
    const admin = createServiceRoleClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit
    const rate = await checkRateLimit(user.id, 'ai_generate')
    if (!rate.allowed) {
      return NextResponse.json({
        error: `Rate limit reached. Try again in ${Math.ceil(rate.reset_in_seconds / 60)} minutes.`
      }, { status: 429 })
    }

    const body = await req.json()
    const kind: Kind = body.kind ?? 'story'

    // Only event HOST (admin_id) can generate — managers blocked by this check
    const { data: event } = await admin
      .from('events').select('id, couple_names, admin_id').eq('id', params.eventId).single()
    if (!event || event.admin_id !== user.id) {
      return NextResponse.json({ error: 'Only the event host can generate content' }, { status: 403 })
    }

    const { count: existing } = await admin
      .from('story_packages').select('id', { count: 'exact', head: true })
      .eq('event_id', params.eventId).eq('format', kind)
    if ((existing ?? 0) >= 6) {
      return NextResponse.json({ error: `Max reached for ${kind}` }, { status: 400 })
    }

    const { data: all } = await admin
      .from('media_with_tags').select('*')
      .eq('event_id', params.eventId).eq('type', 'photo')
      .limit(300)

    if (!all || all.length === 0) {
      return NextResponse.json({ error: 'No photos uploaded yet!' }, { status: 400 })
    }

    const picks = pickForKind(all, kind, existing ?? 0)
    if (picks.length === 0) {
      return NextResponse.json({ error: 'Not enough photos for this kind' }, { status: 400 })
    }

    const photosPerPackage: Record<Kind, number> = {
      story: 1, post: 1, photo_dump: 8, video: 12,
    }
    const per = photosPerPackage[kind]
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const results: any[] = []

    for (let i = 0; i < 2; i++) {
      const start = i * per
      let selected = picks.slice(start, start + per)
      if (selected.length < per) selected = [...selected, ...picks.slice(0, per - selected.length)]
      if (selected.length === 0) continue

      const categories = [...new Set(selected.map((m: any) => m.category).filter(Boolean))]
      const emotions = [...new Set(selected.map((m: any) => m.emotion).filter(Boolean))]
      const ctxParts = []
      if (categories.length > 0) ctxParts.push(`showing ${categories.join(' and ')}`)
      if (emotions.length > 0) ctxParts.push(`with ${emotions.join('/')} energy`)
      const ctx = ctxParts.join(', ')

      const promptByKind: Record<Kind, string> = {
        story: 'a 4-word emotional Instagram Story caption',
        post: 'a 2-sentence warm Instagram post caption + 5 hashtags',
        photo_dump: 'a casual 1-sentence photo dump caption + 3 hashtags',
        video: 'a 3-5 word evocative title for a cinematic highlight reel',
      }

      let captionEn = 'Beautiful moments'
      let captionAr = 'لحظات جميلة'
      let hashtags: string[] = []

      try {
        // Use Haiku for captions too — plenty good for short copy
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Event: "${event.couple_names}" ${ctx ? '— photos ' + ctx : ''}. Write ${promptByKind[kind]}. Variation ${(existing ?? 0) + i + 1}.
Return ONLY valid JSON, no markdown: {"caption_en":"...","caption_ar":"...","hashtags":["..."]}`
          }]
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
        const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim())
        captionEn = parsed.caption_en || captionEn
        captionAr = parsed.caption_ar || captionAr
        hashtags = parsed.hashtags || []
      } catch (err) { console.error('Caption fail:', err) }

      const { data: pkg, error: insertErr } = await admin.from('story_packages').insert({
        event_id: params.eventId, format: kind,
        variant: (existing ?? 0) + i + 1,
        media_ids: selected.map((m: any) => m.id),
        caption_en: captionEn, caption_ar: captionAr, hashtags,
        status: 'ready',
      }).select().single()

      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
      if (pkg) results.push(pkg)
    }

    return NextResponse.json({ packages: results })
  } catch (err: any) {
    console.error('Stories POST error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

function pickForKind(all: any[], kind: Kind, skipCount: number): any[] {
  const scored = all.map(m => ({ ...m, _score: m.quality_score ?? 0 }))
  scored.sort((a, b) => b._score - a._score)

  switch (kind) {
    case 'story': {
      const preferred = scored.filter(m => m.category === 'couple' || m.category === 'ceremony' || m.emotion === 'emotional')
      const pool = preferred.length >= 4 ? preferred : scored
      return pool.slice(skipCount, skipCount + 20)
    }
    case 'post': {
      const preferred = scored.filter(m => m.category === 'couple')
      const pool = preferred.length >= 4 ? preferred : scored
      return pool.slice(skipCount, skipCount + 20)
    }
    case 'photo_dump': {
      const byCategory: Record<string, any[]> = {}
      for (const m of scored) {
        const c = m.category ?? 'uncategorized'
        if (!byCategory[c]) byCategory[c] = []
        byCategory[c].push(m)
      }
      const result: any[] = []
      const cats = Object.keys(byCategory)
      let i = 0
      while (result.length < 30 && cats.some(c => byCategory[c].length > 0)) {
        const c = cats[i % cats.length]
        if (byCategory[c].length > 0) result.push(byCategory[c].shift())
        i++
      }
      return result.slice(skipCount, skipCount + 30)
    }
    case 'video': {
      const byCategory: Record<string, any[]> = {}
      for (const m of scored) {
        const c = m.category ?? 'uncategorized'
        if (!byCategory[c]) byCategory[c] = []
        byCategory[c].push(m)
      }
      const result: any[] = []
      const cats = Object.keys(byCategory)
      let i = 0
      while (result.length < 40 && cats.some(c => byCategory[c].length > 0)) {
        const c = cats[i % cats.length]
        if (byCategory[c].length > 0) result.push(byCategory[c].shift())
        i++
      }
      return result.slice(skipCount, skipCount + 40)
    }
  }
}

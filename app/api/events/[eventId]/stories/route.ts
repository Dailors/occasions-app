// app/api/events/[eventId]/stories/route.ts
// AI content generator — NOW USES REAL TAGS for smart photo selection.
//
// Strategy per kind:
// - story:      1 emotional high-quality photo (prefer couple/ceremony emotional)
// - post:       1 stunning couple-focused photo (prefer highest quality)
// - photo_dump: 6-8 varied photos mixing categories (balanced)
// - video:      12+ photos with good category diversity for cinematic edit

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

  const admin = createServiceRoleClient()
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

    const body = await req.json()
    const kind: Kind = body.kind ?? 'story'

    const { data: event } = await admin
      .from('events').select('id, couple_names')
      .eq('id', params.eventId).eq('admin_id', user.id).single()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

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

    // ── SMART SELECTION by kind ──
    const picks = pickForKind(all, kind, existing ?? 0)
    if (picks.length === 0) {
      return NextResponse.json({ error: 'Not enough photos for this kind yet' }, { status: 400 })
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
      if (selected.length < per) {
        selected = [...selected, ...picks.slice(0, per - selected.length)]
      }
      if (selected.length === 0) continue

      // Build rich context from tags
      const categories = [...new Set(selected.map((m: any) => m.category).filter(Boolean))]
      const emotions = [...new Set(selected.map((m: any) => m.emotion).filter(Boolean))]
      const avgQuality = selected.reduce((s: number, m: any) => s + (m.quality_score ?? 0.5), 0) / selected.length

      const ctxParts = []
      if (categories.length > 0) ctxParts.push(`showing ${categories.join(' and ')}`)
      if (emotions.length > 0) ctxParts.push(`with ${emotions.join('/')} energy`)
      const ctx = ctxParts.join(', ')

      const promptByKind: Record<Kind, string> = {
        story:      'a 4-word emotional Instagram Story caption',
        post:       'a 2-sentence warm Instagram post caption + 5 hashtags',
        photo_dump: 'a casual 1-sentence photo dump caption + 3 hashtags',
        video:      'a 3-5 word evocative title for a cinematic highlight reel',
      }

      let captionEn = 'Beautiful moments'
      let captionAr = 'لحظات جميلة'
      let hashtags: string[] = []

      try {
        const msg = await client.messages.create({
          model: 'claude-opus-4-5-20250929',
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
      } catch (err) {
        console.error('AI caption failed:', err)
      }

      const { data: pkg, error: insertErr } = await admin.from('story_packages').insert({
        event_id:   params.eventId,
        format:     kind,
        variant:    (existing ?? 0) + i + 1,
        media_ids:  selected.map((m: any) => m.id),
        caption_en: captionEn,
        caption_ar: captionAr,
        hashtags:   hashtags,
        status:     'ready',
      }).select().single()

      if (insertErr) {
        console.error('Insert failed:', insertErr)
        return NextResponse.json({ error: 'Save failed: ' + insertErr.message }, { status: 500 })
      }
      if (pkg) results.push(pkg)
    }

    return NextResponse.json({ packages: results })
  } catch (err: any) {
    console.error('Stories POST error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

// ────────────────────────────────────────────────────────────
// SMART PHOTO SELECTION
// Uses tags to pick the best photos for each kind of content.
// ────────────────────────────────────────────────────────────
function pickForKind(all: any[], kind: Kind, skipCount: number): any[] {
  // Fallback scoring: 0 if no quality_score, so untagged photos still work
  const scored = all.map(m => ({
    ...m,
    _score: m.quality_score ?? 0,
  }))

  // Sort by quality score (highest first)
  scored.sort((a, b) => b._score - a._score)

  switch (kind) {
    case 'story': {
      // Best emotional or couple shots
      const preferred = scored.filter(m =>
        (m.category === 'couple' || m.category === 'ceremony' || m.emotion === 'emotional')
      )
      const pool = preferred.length >= 4 ? preferred : scored
      return pool.slice(skipCount, skipCount + 20)
    }

    case 'post': {
      // Highest-quality couple/portrait shots
      const preferred = scored.filter(m => m.category === 'couple')
      const pool = preferred.length >= 4 ? preferred : scored
      return pool.slice(skipCount, skipCount + 20)
    }

    case 'photo_dump': {
      // Balanced mix across categories
      const byCategory: Record<string, any[]> = {}
      for (const m of scored) {
        const cat = m.category ?? 'uncategorized'
        if (!byCategory[cat]) byCategory[cat] = []
        byCategory[cat].push(m)
      }
      // Interleave categories
      const result: any[] = []
      const cats = Object.keys(byCategory)
      let idx = 0
      while (result.length < 30 && cats.some(c => byCategory[c].length > 0)) {
        const cat = cats[idx % cats.length]
        if (byCategory[cat].length > 0) {
          result.push(byCategory[cat].shift())
        }
        idx++
      }
      return result.slice(skipCount, skipCount + 30)
    }

    case 'video': {
      // Good diversity — prefer high quality with variety
      const byCategory: Record<string, any[]> = {}
      for (const m of scored) {
        const cat = m.category ?? 'uncategorized'
        if (!byCategory[cat]) byCategory[cat] = []
        byCategory[cat].push(m)
      }
      const result: any[] = []
      const cats = Object.keys(byCategory)
      let idx = 0
      while (result.length < 40 && cats.some(c => byCategory[c].length > 0)) {
        const cat = cats[idx % cats.length]
        if (byCategory[cat].length > 0) {
          result.push(byCategory[cat].shift())
        }
        idx++
      }
      return result.slice(skipCount, skipCount + 40)
    }
  }
}

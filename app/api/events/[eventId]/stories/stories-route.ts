// app/api/events/[eventId]/stories/route.ts
// Generates AI-curated story packages from event media.
// Uses Claude to pick best photos + generate captions in EN/AR.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

type Params = { params: { eventId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: packages } = await supabase
    .from('story_packages')
    .select('*')
    .eq('event_id', params.eventId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ packages: packages ?? [] })
}

export async function POST(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const admin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify host
  const { data: event } = await supabase
    .from('events').select('id, couple_names').eq('id', params.eventId).eq('admin_id', user.id).single()
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get all media with tags
  const { data: media } = await admin
    .from('media_with_tags')
    .select('*')
    .eq('event_id', params.eventId)
    .eq('type', 'photo')
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(50)

  if (!media || media.length < 6) {
    return NextResponse.json({ error: 'Need at least 6 photos to generate stories' }, { status: 400 })
  }

  // Pick best photos heuristically (AI tagger already scored them)
  const topPhotos = media.filter((m: any) => (m.quality_score ?? 0) > 0.5).slice(0, 30)
  const fallback  = media.slice(0, 30)
  const selectedPool = topPhotos.length >= 6 ? topPhotos : fallback

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  // Generate 6 packages: 2 stories (1 photo each), 2 posts (1 photo each), 2 photo dumps (6-8 photos each)
  const packageDefs: { format: 'story'|'post'|'photo_dump'; count: number }[] = [
    { format: 'story',      count: 1 },
    { format: 'story',      count: 1 },
    { format: 'post',       count: 1 },
    { format: 'post',       count: 1 },
    { format: 'photo_dump', count: 8 },
    { format: 'photo_dump', count: 6 },
  ]

  const results: any[] = []
  let poolIndex = 0

  for (let i = 0; i < packageDefs.length; i++) {
    const def = packageDefs[i]
    const selected = selectedPool.slice(poolIndex, poolIndex + def.count)
    if (selected.length < def.count) break
    poolIndex += def.count

    // Caption from Claude
    const categorySet = new Set(selected.map((m: any) => m.category).filter(Boolean))
    const categoryList = Array.from(categorySet).join(', ')
    const emotionSet = new Set(selected.map((m: any) => m.emotion).filter(Boolean))
    const emotionList = Array.from(emotionSet).join(', ')

    const formatPrompt: Record<string, string> = {
      story:      'a short Instagram Story caption (max 6 words)',
      post:       'an Instagram post caption (2-3 sentences, emotional, warm) and 5 relevant hashtags',
      photo_dump: 'a photo dump caption (casual, fun, 1-2 sentences) and 3 hashtags',
    }

    try {
      const msg = await client.messages.create({
        model: 'claude-opus-4-5-20250929',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `The event is "${event.couple_names}". The photos contain: ${categoryList || 'general celebration'}, emotions: ${emotionList || 'joy'}.
Write ${formatPrompt[def.format]}.
Return JSON only:
{
  "caption_en": "English caption",
  "caption_ar": "Arabic caption",
  "hashtags": ["tag1", "tag2"]
}
No markdown, no explanation, just JSON.`
        }]
      })

      const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
      const cleaned = text.replace(/```json|```/g, '').trim()
      let parsed: any = {}
      try { parsed = JSON.parse(cleaned) } catch {}

      const { data: pkg } = await admin.from('story_packages').insert({
        event_id:   params.eventId,
        format:     def.format,
        variant:    (results.filter(r => r.format === def.format).length) + 1,
        media_ids:  selected.map((m: any) => m.id),
        caption_en: parsed.caption_en ?? '',
        caption_ar: parsed.caption_ar ?? '',
        hashtags:   parsed.hashtags ?? [],
        status:     'ready',
      }).select().single()

      if (pkg) results.push(pkg)
    } catch (err: any) {
      console.error('Story gen failed:', err)
    }
  }

  return NextResponse.json({ packages: results })
}

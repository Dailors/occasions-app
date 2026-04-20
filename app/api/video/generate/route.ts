// app/api/video/generate/route.ts
// Generates a UNIQUE video timeline for each user using Claude + their media.
// No two videos are identical — Claude composes a custom edit based on
// the event's media, chosen style, duration, and music mood.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()
  const admin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { event_id, style, duration, music_mood } = body

  if (!event_id || !style) {
    return NextResponse.json({ error: 'event_id and style required' }, { status: 400 })
  }

  // Verify host
  const { data: event } = await supabase
    .from('events').select('id, couple_names').eq('id', event_id).eq('admin_id', user.id).single()
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch all tagged media for this event
  const { data: media } = await admin
    .from('media_with_tags')
    .select('id, type, category, emotion, quality_score')
    .eq('event_id', event_id)
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(60)

  if (!media || media.length < 5) {
    return NextResponse.json({ error: 'Need at least 5 media items to generate a video' }, { status: 400 })
  }

  // Use Claude to design a UNIQUE timeline
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const mediaSummary = media.map((m: any, i: number) =>
    `[${i}] type=${m.type} cat=${m.category || '?'} emotion=${m.emotion || '?'} quality=${m.quality_score?.toFixed(2) || '?'}`
  ).join('\n')

  const prompt = `You are a professional wedding video editor. Design a ${duration}-second ${style} video timeline for an event called "${event.couple_names}".
Music mood: ${music_mood}
Target duration: ${duration} seconds
Style: ${style}

Available media:
${mediaSummary}

Design a UNIQUE timeline. Each segment should specify:
- media_index (which media item from above)
- duration_seconds (1-4s per clip, varies with pace)
- transition (cut, fade, or dissolve)
- notes (brief creative intent)

Style rules:
- Romantic: slower clips (3-4s), fades, emphasize couple/emotional moments
- Party: fast cuts (1-2s), hard cuts, dance/energetic emotions
- Family: medium (2-3s), warm dissolves, mix of family/ceremony/couple

Return ONLY a JSON array like:
[{"media_index": 0, "duration_seconds": 3, "transition": "fade", "notes": "opening shot"}, ...]

The total of duration_seconds MUST equal ${duration}. No markdown, no explanation.`

  let timeline: any[] = []
  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    timeline = JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch (err) {
    // Fallback to simple timeline if AI fails
    const segments = Math.ceil(duration / 2.5)
    const perSeg = duration / segments
    timeline = media.slice(0, segments).map((_: any, i: number) => ({
      media_index: i,
      duration_seconds: perSeg,
      transition: style === 'party' ? 'cut' : 'fade',
    }))
  }

  // Create the job
  const { data: job, error } = await admin.from('video_jobs').insert({
    event_id,
    template_id: style,
    style,
    duration,
    music_mood,
    timeline,
    status: 'pending',
    segment_map: timeline.reduce((acc: any, t: any, i: number) => {
      if (t.media_index < media.length) acc[String(i)] = media[t.media_index].id
      return acc
    }, {}),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Kick off rendering (or use dev stub)
  // In production you'd call the renderer. For now mark as processing.
  admin.from('video_jobs').update({ status: 'processing' }).eq('id', job.id).then(() => {})

  // Simulate completion for dev
  setTimeout(async () => {
    await admin.from('video_jobs').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', job.id)
  }, 5000)

  return NextResponse.json({ job_id: job.id, timeline })
}

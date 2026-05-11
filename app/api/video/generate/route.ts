// app/api/video/generate/route.ts
// POST: create a Creatomate render job using one of our 16 templates.
// Returns job_id; client polls /api/video/status/[jobId].

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getTemplate } from '@/lib/video-templates'
import { buildCreatomateSource } from '@/lib/creatomate-builder'

export const maxDuration = 60

export async function POST(req: NextRequest) {
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
    const { event_id, template_id } = body

    if (!event_id || !template_id) {
      return NextResponse.json({ error: 'event_id and template_id required' }, { status: 400 })
    }

    const template = getTemplate(template_id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Verify host owns event
    const { data: event } = await admin
      .from('events').select('id, couple_names, wedding_date, admin_id')
      .eq('id', event_id).eq('admin_id', user.id).single()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Smart photo selection — get tagged photos sorted by quality
    const { data: allMedia } = await admin
      .from('media_with_tags').select('*')
      .eq('event_id', event_id).eq('type', 'photo')
      .limit(200)

    if (!allMedia || allMedia.length === 0) {
      return NextResponse.json({ error: 'No photos uploaded yet. Ask guests to upload some first!' }, { status: 400 })
    }

    if (allMedia.length < template.photo_count) {
      return NextResponse.json({
        error: `This template needs ${template.photo_count} photos. You have ${allMedia.length}.`
      }, { status: 400 })
    }

    // Pick best photos: highest quality + diverse categories
    const picked = pickPhotosForTemplate(allMedia, template.photo_count, template.style)

    // Get signed URLs (long-lived for the render)
    const photo_urls: string[] = []
    for (const m of picked) {
      const bucket = m.url_compressed ? 'media-compressed' : 'media-originals'
      const path = m.url_compressed ?? m.url_original
      const { data: signed } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60 * 2)
      if (signed?.signedUrl) photo_urls.push(signed.signedUrl)
    }

    if (photo_urls.length < template.photo_count) {
      return NextResponse.json({ error: 'Could not load photos. Try again.' }, { status: 500 })
    }

    // Build Creatomate source JSON
    const dateText = event.wedding_date
      ? new Date(event.wedding_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    const source = buildCreatomateSource({
      template,
      photo_urls,
      title_text: event.couple_names,
      subtitle: dateText,
    })

    // Call Creatomate API
    const apiKey = process.env.CREATOMATE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Video service not configured. Contact support.' }, { status: 500 })
    }

    const renderRes = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source }),
    })

    const renderData = await renderRes.json()

    if (!renderRes.ok) {
      console.error('Creatomate error:', renderData)
      return NextResponse.json({
        error: 'Video rendering failed: ' + (renderData.message ?? renderData.error ?? 'Unknown error')
      }, { status: 500 })
    }

    // Creatomate returns array of renders
    const render = Array.isArray(renderData) ? renderData[0] : renderData
    const renderId = render.id

    // Save the job to our database
    const { data: job, error: insertErr } = await admin.from('video_jobs').insert({
      event_id,
      template_id,
      status: render.status === 'succeeded' ? 'done' : 'processing',
      style: template.style,
      duration: template.duration,
      music_mood: template.music_vibe,
      timeline: { creatomate_id: renderId, photos_used: photo_urls.length, template_name: template.name_en },
      segment_map: { creatomate_render_id: renderId },
    }).select().single()

    if (insertErr) {
      console.error('Job insert failed:', insertErr)
      return NextResponse.json({ error: 'Could not save job: ' + insertErr.message }, { status: 500 })
    }

    // If already done (synchronous), save the URL
    if (render.status === 'succeeded' && render.url) {
      await admin.from('generated_videos').insert({
        job_id: job.id,
        format: 'reel',
        url: render.url,
      })
      await admin.from('video_jobs').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', job.id)
    }

    return NextResponse.json({
      job_id: job.id,
      creatomate_id: renderId,
      status: render.status,
      url: render.url ?? null,
    })
  } catch (err: any) {
    console.error('Video generate error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

// Pick the best N photos with diversity across categories
function pickPhotosForTemplate(all: any[], count: number, style: string): any[] {
  // Sort by quality
  const scored = [...all].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))

  // Match style preferences
  const preferences: Record<string, string[]> = {
    romantic:  ['couple', 'ceremony'],
    hype:      ['dance', 'family'],
    cinematic: ['couple', 'venue', 'ceremony'],
    family:    ['family', 'ceremony'],
    aesthetic: ['venue', 'couple'],
  }
  const prefCats = preferences[style] ?? []

  // First pass: pick photos matching style preferences
  const preferred = scored.filter(m => prefCats.includes(m.category))
  const rest = scored.filter(m => !prefCats.includes(m.category))

  // Combine, preferring preferred first
  const combined = [...preferred, ...rest]

  // Pick distinct photos, interleaved by category for diversity
  const byCategory: Record<string, any[]> = {}
  for (const m of combined) {
    const c = m.category ?? 'uncategorized'
    if (!byCategory[c]) byCategory[c] = []
    byCategory[c].push(m)
  }

  const result: any[] = []
  const cats = Object.keys(byCategory)
  let idx = 0
  while (result.length < count && cats.some(c => byCategory[c].length > 0)) {
    const c = cats[idx % cats.length]
    if (byCategory[c].length > 0) {
      result.push(byCategory[c].shift())
    }
    idx++
  }
  return result
}

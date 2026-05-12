// app/api/video/generate/route.ts
// Generates a Creatomate render using the slot-based template system.
// Picks photos for photo slots, video clips for video slots, best fit for either slots.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getTemplate, slotCounts, type VideoTemplate, type MediaSlot } from '@/lib/video-templates'
import { buildCreatomateSource, type MediaItem } from '@/lib/creatomate-builder'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const admin = createServiceRoleClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rate = await checkRateLimit(user.id, 'ai_generate')
    if (!rate.allowed) {
      return NextResponse.json({
        error: `Rate limit reached. Try again in ${Math.ceil(rate.reset_in_seconds / 60)} minutes.`
      }, { status: 429 })
    }

    const { event_id, template_id } = await req.json()
    if (!event_id || !template_id) {
      return NextResponse.json({ error: 'event_id and template_id required' }, { status: 400 })
    }

    const template = getTemplate(template_id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Host owns event
    const { data: event } = await admin
      .from('events').select('id, couple_names, wedding_date, admin_id')
      .eq('id', event_id).eq('admin_id', user.id).single()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Fetch all media with tags
    const { data: allMedia } = await admin
      .from('media_with_tags').select('*')
      .eq('event_id', event_id).limit(300)

    if (!allMedia || allMedia.length === 0) {
      return NextResponse.json({ error: 'No photos or videos uploaded yet. Ask guests to upload some first!' }, { status: 400 })
    }

    const photos = allMedia.filter((m: any) => m.type === 'photo')
    const videos = allMedia.filter((m: any) => m.type === 'video')

    const counts = slotCounts(template)

    // Calculate how many of each we ACTUALLY need
    const need = calculateNeeds(template, photos.length, videos.length)

    if (need.photos > photos.length) {
      return NextResponse.json({
        error: `Template needs ${counts.photo + counts.either} photos but you only have ${photos.length}.`
      }, { status: 400 })
    }

    // Sort by quality
    const photosByQuality = [...photos].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
    const videosByQuality = [...videos].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))

    // Pick photos & videos with style preferences
    const pickedPhotos = pickForStyle(photosByQuality, need.photos, template.style)
    const pickedVideos = pickForStyle(videosByQuality, need.videos, template.style)

    // Fill slots in order, choosing the right media for each slot type
    const mediaSequence: MediaItem[] = []
    let photoIdx = 0
    let videoIdx = 0

    for (const slot of template.slots) {
      let pick: any = null
      let pickType: 'photo' | 'video' = 'photo'

      if (slot.type === 'video' && videoIdx < pickedVideos.length) {
        pick = pickedVideos[videoIdx++]
        pickType = 'video'
      } else if (slot.type === 'photo' && photoIdx < pickedPhotos.length) {
        pick = pickedPhotos[photoIdx++]
        pickType = 'photo'
      } else if (slot.type === 'either') {
        // Prefer video if available, otherwise photo
        if (videoIdx < pickedVideos.length) {
          pick = pickedVideos[videoIdx++]
          pickType = 'video'
        } else if (photoIdx < pickedPhotos.length) {
          pick = pickedPhotos[photoIdx++]
          pickType = 'photo'
        }
      } else {
        // Fallback: video slot but no videos → use photo
        if (slot.type === 'video' && photoIdx < pickedPhotos.length) {
          pick = pickedPhotos[photoIdx++]
          pickType = 'photo'
        }
      }

      if (pick) {
        // Get signed URL — videos use original, photos use compressed if available
        const bucket = pickType === 'video'
          ? 'media-originals'
          : (pick.url_compressed ? 'media-compressed' : 'media-originals')
        const path = pickType === 'video'
          ? pick.url_original
          : (pick.url_compressed ?? pick.url_original)

        const { data: signed } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60 * 2)
        if (signed?.signedUrl) {
          mediaSequence.push({ type: pickType, url: signed.signedUrl })
        }
      }
    }

    if (mediaSequence.length === 0) {
      return NextResponse.json({ error: 'Could not load media. Try again.' }, { status: 500 })
    }

    // Build Creatomate source
    const dateText = event.wedding_date
      ? new Date(event.wedding_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    const source = buildCreatomateSource({
      template,
      media: mediaSequence,
      title_text: event.couple_names,
      subtitle: dateText,
    })

    const apiKey = process.env.CREATOMATE_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Video service not configured' }, { status: 500 })

    const renderRes = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    })

    const renderData = await renderRes.json()

    if (!renderRes.ok) {
      console.error('Creatomate error:', renderData)
      return NextResponse.json({
        error: 'Render failed: ' + (renderData.message ?? renderData.error ?? 'Unknown')
      }, { status: 500 })
    }

    const render = Array.isArray(renderData) ? renderData[0] : renderData
    const renderId = render.id

    const { data: job, error: insertErr } = await admin.from('video_jobs').insert({
      event_id,
      template_id,
      status: render.status === 'succeeded' ? 'done' : 'processing',
      style: template.style,
      duration: source.duration,
      music_mood: template.music_vibe,
      timeline: {
        creatomate_id: renderId,
        photos_used: mediaSequence.filter(m => m.type === 'photo').length,
        videos_used: mediaSequence.filter(m => m.type === 'video').length,
        template_name: template.name_en,
      },
      segment_map: { creatomate_render_id: renderId },
    }).select().single()

    if (insertErr) return NextResponse.json({ error: 'Could not save job: ' + insertErr.message }, { status: 500 })

    if (render.status === 'succeeded' && render.url) {
      await admin.from('generated_videos').insert({ job_id: job.id, format: 'reel', url: render.url })
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

// Calculates real photo/video need, accounting for "either" slots filling with whatever's available
function calculateNeeds(template: VideoTemplate, photosAvailable: number, videosAvailable: number) {
  let photosNeeded = template.slots.filter(s => s.type === 'photo').length
  let videosNeeded = template.slots.filter(s => s.type === 'video').length
  const eitherCount = template.slots.filter(s => s.type === 'either').length

  // For "either" slots, prefer video if available
  const videoBudgetRemaining = Math.max(0, videosAvailable - videosNeeded)
  const eitherUsesVideo = Math.min(eitherCount, videoBudgetRemaining)
  const eitherUsesPhoto = eitherCount - eitherUsesVideo

  videosNeeded += eitherUsesVideo
  photosNeeded += eitherUsesPhoto

  // If we don't have enough videos for the dedicated video slots, fall back to photos
  if (videosAvailable < videosNeeded) {
    const shortfall = videosNeeded - videosAvailable
    videosNeeded -= shortfall
    photosNeeded += shortfall
  }

  return { photos: photosNeeded, videos: videosNeeded }
}

// Picks best N items, interleaved by category for diversity, with style preferences
function pickForStyle(items: any[], count: number, style: string): any[] {
  if (count === 0) return []

  const preferences: Record<string, string[]> = {
    romantic:  ['couple', 'ceremony'],
    hype:      ['dance', 'family'],
    cinematic: ['couple', 'venue', 'ceremony'],
    family:    ['family', 'ceremony'],
    aesthetic: ['venue', 'couple'],
  }
  const prefCats = preferences[style] ?? []

  const preferred = items.filter(m => prefCats.includes(m.category))
  const rest = items.filter(m => !prefCats.includes(m.category))
  const combined = [...preferred, ...rest]

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
    if (byCategory[c].length > 0) result.push(byCategory[c].shift())
    idx++
  }
  return result
}

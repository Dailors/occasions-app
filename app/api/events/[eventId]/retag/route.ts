// app/api/events/[eventId]/retag/route.ts
// Admin-only: batch-tag all untagged photos in the event.
// Call this once after deploying to tag all existing photos.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300  // 5 min max

type Params = { params: { eventId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const admin = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event } = await admin
    .from('events').select('id').eq('id', params.eventId).eq('admin_id', user.id).single()
  if (!event) return NextResponse.json({ error: 'Not your event' }, { status: 404 })

  // Find all photos without tags
  const { data: photos } = await admin
    .from('media').select('id').eq('event_id', params.eventId).eq('type', 'photo')

  if (!photos || photos.length === 0) {
    return NextResponse.json({ tagged: 0, skipped: 0 })
  }

  const { data: tagged } = await admin
    .from('media_tags').select('media_id').in('media_id', photos.map(p => p.id))
  const taggedIds = new Set((tagged ?? []).map(t => t.media_id))
  const toTag = photos.filter(p => !taggedIds.has(p.id))

  const origin = req.nextUrl.origin
  let completed = 0
  let failed = 0

  // Process in batches of 5 in parallel
  for (let i = 0; i < toTag.length; i += 5) {
    const batch = toTag.slice(i, i + 5)
    await Promise.all(batch.map(async (p) => {
      try {
        const r = await fetch(`${origin}/api/tag-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ media_id: p.id }),
        })
        if (r.ok) completed++
        else failed++
      } catch { failed++ }
    }))
  }

  return NextResponse.json({ tagged: completed, failed, total: toTag.length })
}

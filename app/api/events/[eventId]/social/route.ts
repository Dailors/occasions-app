// app/api/events/[eventId]/social/route.ts
// Generates AI social media captions and story overlays for an event.
// Admin-only. Returns fresh content on every call.

import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateSocialContent } from '@/lib/ai/social'

type Params = { params: { eventId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event } = await supabase
    .from('events')
    .select('couple_names, wedding_date')
    .eq('id', params.eventId)
    .eq('admin_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const content = await generateSocialContent(event.couple_names, event.wedding_date)
    return NextResponse.json(content)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// app/api/join-album/route.ts
import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()
  const { access_token } = await req.json()

  if (!access_token) {
    return NextResponse.json({ error: 'Missing access_token' }, { status: 400 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('id, event_id, name, type, events(couple_names, wedding_date, status)')
    .eq('access_token', access_token)
    .single()

  if (albumError || !album) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  const event = album.events as any
  if (event?.status === 'closed') {
    return NextResponse.json({ error: 'This wedding is no longer accepting uploads' }, { status: 403 })
  }

  const { error: guestError } = await supabase
    .from('event_guests')
    .upsert(
      { event_id: album.event_id, album_id: album.id, user_id: user.id, access_token },
      { onConflict: 'event_id,user_id', ignoreDuplicates: true }
    )

  if (guestError) {
    return NextResponse.json({ error: 'Could not register guest' }, { status: 500 })
  }

  return NextResponse.json({
    album: { id: album.id, name: album.name, type: album.type },
    event: { id: album.event_id, couple_names: event?.couple_names, wedding_date: event?.wedding_date },
  })
}

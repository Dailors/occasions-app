// app/api/events/[eventId]/albums/route.ts
// GET  → list albums for an event (admin or guest via token)
// POST → create a new album in an event (admin only)
// PATCH → rename an album (admin only)

import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { eventId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin sees all albums; RLS handles the visibility automatically
  const { data: albums, error } = await supabase
    .from('albums')
    .select('id, name, type, access_token, created_at')
    .eq('event_id', params.eventId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ albums })
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createRouteClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only event admin can add albums
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', params.eventId)
    .eq('admin_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, type } = await req.json()
  if (!name || !type) return NextResponse.json({ error: 'name and type required' }, { status: 400 })
  if (!['mixed', 'men', 'women'].includes(type)) {
    return NextResponse.json({ error: 'type must be mixed | men | women' }, { status: 400 })
  }

  const { data: album, error } = await supabase
    .from('albums')
    .insert({ event_id: params.eventId, name, type })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ album }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createRouteClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { albumId, name } = await req.json()
  if (!albumId || !name) return NextResponse.json({ error: 'albumId and name required' }, { status: 400 })

  // Verify admin owns the event that owns this album
  const { data: album } = await supabase
    .from('albums')
    .select('id, events!inner(admin_id)')
    .eq('id', albumId)
    .eq('event_id', params.eventId)
    .single()

  if (!album) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((album.events as any)?.admin_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: updated, error } = await supabase
    .from('albums')
    .update({ name })
    .eq('id', albumId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ album: updated })
}

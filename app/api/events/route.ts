// app/api/events/route.ts
// GET  → list admin's events
// POST → create a new event with default albums

import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: events, error } = await supabase
    .from('event_summary')
    .select('*')
    .order('wedding_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { couple_names, wedding_date, location } = await req.json()

  if (!couple_names) {
    return NextResponse.json({ error: 'couple_names is required' }, { status: 400 })
  }

  // Create event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({ admin_id: user.id, couple_names, wedding_date: wedding_date || null, location: location || null })
    .select()
    .single()

  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 })

  // Create the 3 default albums
  const albums = [
    { event_id: event.id, name: 'Mixed Album',       type: 'mixed'  },
    { event_id: event.id, name: 'Men\'s Album',      type: 'men'    },
    { event_id: event.id, name: 'Women\'s Album',    type: 'women'  },
  ]

  const { data: createdAlbums, error: albumError } = await supabase
    .from('albums')
    .insert(albums)
    .select()

  if (albumError) return NextResponse.json({ error: albumError.message }, { status: 500 })

  return NextResponse.json({ event, albums: createdAlbums }, { status: 201 })
}

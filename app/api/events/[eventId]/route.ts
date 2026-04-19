// app/api/events/[eventId]/route.ts
import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { eventId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event, error } = await supabase
    .from('events')
    .select(`*, albums(*), event_guests(*, profiles(full_name, avatar_url))`)
    .eq('id', params.eventId)
    .eq('admin_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ event })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['couple_names', 'wedding_date', 'location', 'status']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data: event, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', params.eventId)
    .eq('admin_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', params.eventId)
    .eq('admin_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

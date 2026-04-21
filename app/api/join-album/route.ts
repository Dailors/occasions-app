// app/api/join-album/route.ts
// Called when a guest opens an upload link.
// Validates the album access_token, checks PIN if required,
// creates an event_guests row so the guest can upload.

import { createRouteClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const admin = createServiceRoleClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { token, pin } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Look up the album by access token (using admin client to bypass RLS)
    const { data: album, error: albumError } = await admin
      .from('albums')
      .select('id, event_id, name, type, pin_code, access_token')
      .eq('access_token', token)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Invalid upload link' }, { status: 400 })
    }

    // Get the event
    const { data: event } = await admin
      .from('events')
      .select('id, couple_names, wedding_date, status')
      .eq('id', album.event_id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check PIN if required
    if (album.pin_code && album.pin_code.length > 0) {
      if (!pin) {
        return NextResponse.json({
          error: 'PIN required',
          event: { id: event.id, couple_names: event.couple_names },
          album: { id: album.id, name: album.name, type: album.type },
        }, { status: 200 })
      }
      if (pin !== album.pin_code) {
        return NextResponse.json({
          error: 'Incorrect PIN',
          event: { id: event.id, couple_names: event.couple_names },
          album: { id: album.id, name: album.name, type: album.type },
        }, { status: 200 })
      }
    }

    // Make sure the user has a profile (might be anonymous guest)
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      await admin.from('profiles').insert({
        id: user.id,
        role: 'guest',
        full_name: user.email?.split('@')[0] ?? 'Guest',
      })
    }

    // Create the event_guests row (idempotent)
    await admin
      .from('event_guests')
      .upsert({
        event_id: event.id,
        album_id: album.id,
        user_id: user.id,
        access_token: token,
      }, { onConflict: 'event_id,user_id' })

    return NextResponse.json({
      event: {
        id: event.id,
        couple_names: event.couple_names,
        wedding_date: event.wedding_date,
      },
      album: {
        id: album.id,
        name: album.name,
        type: album.type,
      },
    })
  } catch (err: any) {
    console.error('join-album error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

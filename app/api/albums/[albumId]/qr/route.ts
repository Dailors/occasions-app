// app/api/albums/[albumId]/qr/route.ts
// Returns a QR code as SVG or PNG for a given album's access link.

import { createRouteClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { buildUploadUrl } from '@/lib/utils'

type Params = { params: { albumId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  const supabase = createRouteClient()
  const format   = req.nextUrl.searchParams.get('format') ?? 'svg' // 'svg' | 'png'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch album — RLS ensures only the event admin can access this
  const { data: album, error } = await supabase
    .from('albums')
    .select('id, access_token, name, type, events(admin_id)')
    .eq('id', params.albumId)
    .single()

  if (error || !album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 })
  }

  const event = album.events as any
  if (event?.admin_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const uploadUrl = buildUploadUrl(album.access_token)

  if (format === 'png') {
    const buffer = await QRCode.toBuffer(uploadUrl, {
      type:           'png',
      width:          512,
      margin:         2,
      color:          { dark: '#1a1a1a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        'image/png',
        'Content-Disposition': `attachment; filename="occasions-qr-${album.type}.png"`,
      },
    })
  }

  // Default: SVG
  const svg = await QRCode.toString(uploadUrl, {
    type:   'svg',
    margin: 2,
    color:  { dark: '#1a1a1a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  })
}

// app/auth/callback/route.ts
// Handles Supabase auth redirect (OAuth / magic link / email confirmation).

import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code     = searchParams.get('code')
  const next     = searchParams.get('next') ?? '/dashboard'
  const errorMsg = searchParams.get('error_description')

  if (errorMsg) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorMsg)}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase    = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()      { return cookieStore.getAll() },
          setAll(toSet) {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}

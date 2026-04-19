import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If env vars missing, just let the request through (fail open)
    if (!url || !key) {
      console.error('Missing Supabase env vars in middleware')
      return NextResponse.next()
    }

    let res = NextResponse.next({ request: req })

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = req.nextUrl

    // Protect /dashboard
    if (pathname.startsWith('/dashboard') && !user) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Protect /upload — send to guest auto sign-in
    if (pathname.startsWith('/upload/') && !user) {
      const token = pathname.split('/')[2]
      if (token) {
        return NextResponse.redirect(new URL(`/auth/guest?token=${token}`, req.url))
      }
    }

    return res
  } catch (err) {
    console.error('Middleware error:', err)
    // If anything crashes, let the request through
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-|manifest|api/health).*)',
  ],
}

// middleware.ts  (root of project)
// Refreshes Supabase session cookies on every request.
// Protects /dashboard routes — redirects unauthenticated users to /auth/login.
// Protects /upload routes — auto signs in guests anonymously if no session.

import { createServerClient } from '@supabase/ssr'
import { NextResponse }       from 'next/server'
import type { NextRequest }   from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()         { return req.cookies.getAll() },
        setAll(toSet: { name: string; value: string; options?: any }[]) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  // IMPORTANT: always call getUser() to refresh the session cookie
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // ── Protect admin dashboard ──────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login?error=not_admin', req.url))
    }
  }

  // ── Guest upload auto sign-in ────────────────────────────
  if (pathname.startsWith('/upload/')) {
    if (!user) {
      const token = pathname.split('/')[2]
      return NextResponse.redirect(
        new URL(`/auth/guest?token=${token}`, req.url)
      )
    }
  }

  return res
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|icon-|manifest).*)',
  ],
}

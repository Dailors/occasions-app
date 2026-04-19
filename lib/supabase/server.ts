// lib/supabase/server.ts
// Server-side Supabase clients — use in Server Components, Route Handlers, Server Actions.
// Uses @supabase/ssr which correctly reads/writes cookies in Next.js App Router.

import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient }         from '@supabase/supabase-js'
import { cookies }                                      from 'next/headers'

// For Server Components and Route Handlers
export function createServerClient() {
  const cookieStore = cookies()
  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()      { return cookieStore.getAll() },
        setAll(toSet: { name: string; value: string; options?: any }[]) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — writes are handled by middleware.
          }
        },
      },
    }
  )
}

// Alias so existing route handlers that import createRouteClient keep working
export { createServerClient as createRouteClient }

// Service role — bypasses RLS. Only use in trusted server contexts.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

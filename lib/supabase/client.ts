// lib/supabase/client.ts
// Browser-side Supabase client — use in Client Components ('use client').
// Uses @supabase/ssr for proper Next.js 14 App Router cookie handling.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

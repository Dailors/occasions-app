// lib/rate-limit.ts
// Simple rate limiting using Supabase.
// Tracks API call counts per user per hour/day.

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset_in_seconds: number
}

// Default limits per user
const LIMITS = {
  tag_media:       { per_hour: 200, per_day: 2000 },   // Auto-tagging
  support_chat:    { per_hour: 30,  per_day: 100  },   // Chatbot
  ai_generate:     { per_hour: 20,  per_day: 60   },   // Story/post/video gen
  retag_batch:     { per_hour: 3,   per_day: 10   },   // Bulk retag
}

export type RateKind = keyof typeof LIMITS

export async function checkRateLimit(
  userId: string,
  kind: RateKind
): Promise<RateLimitResult> {
  const admin = createServiceRoleClient()
  const limit = LIMITS[kind]

  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Count recent hits
  const { count: hourCount } = await admin
    .from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', kind)
    .gte('created_at', hourAgo.toISOString())

  const { count: dayCount } = await admin
    .from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', kind)
    .gte('created_at', dayAgo.toISOString())

  if ((hourCount ?? 0) >= limit.per_hour) {
    return { allowed: false, remaining: 0, reset_in_seconds: 3600 }
  }
  if ((dayCount ?? 0) >= limit.per_day) {
    return { allowed: false, remaining: 0, reset_in_seconds: 86400 }
  }

  // Log the hit
  await admin.from('rate_limit_log').insert({ user_id: userId, kind })

  return {
    allowed: true,
    remaining: limit.per_hour - (hourCount ?? 0) - 1,
    reset_in_seconds: 3600,
  }
}

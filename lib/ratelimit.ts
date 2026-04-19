// lib/ratelimit.ts
// Simple in-memory rate limiter for the upload endpoint.
// Limits each user to 100 uploads per hour.
// For production use a Redis-backed solution (e.g. Upstash).

interface Bucket {
  count:     number
  resetAt:   number   // Unix timestamp ms
}

const buckets = new Map<string, Bucket>()

const WINDOW_MS   = 60 * 60 * 1000   // 1 hour
const MAX_UPLOADS = 100               // per window per user

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now    = Date.now()
  const bucket = buckets.get(userId)

  if (!bucket || now > bucket.resetAt) {
    // New or expired bucket
    const newBucket: Bucket = { count: 1, resetAt: now + WINDOW_MS }
    buckets.set(userId, newBucket)
    return { allowed: true, remaining: MAX_UPLOADS - 1, resetAt: newBucket.resetAt }
  }

  if (bucket.count >= MAX_UPLOADS) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count++
  return { allowed: true, remaining: MAX_UPLOADS - bucket.count, resetAt: bucket.resetAt }
}

// Cleanup expired buckets periodically (call from a cron or just let it grow — it's small)
export function pruneExpiredBuckets() {
  const now = Date.now()
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}

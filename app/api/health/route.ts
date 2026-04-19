// app/api/health/route.ts
// Simple health check — used by Vercel and uptime monitors.

import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    ts:     new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
  })
}

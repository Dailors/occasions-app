// app/auth/guest/page.tsx
// Called by middleware when a guest hits /upload/[token] without a session.
// Signs them in anonymously, then bounces them to the upload page.
'use client'

export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function GuestAuthPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')
  const supabase     = createClient()

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login')
      return
    }

    supabase.auth.signInAnonymously().then(({ error }) => {
      if (error) {
        router.replace(`/auth/login?error=${encodeURIComponent(error.message)}`)
      } else {
        router.replace(`/upload/${token}`)
      }
    })
  }, [token, router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg animate-pulse-slow">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-gray-500">Preparing your upload page…</p>
      </div>
    </div>
  )
}

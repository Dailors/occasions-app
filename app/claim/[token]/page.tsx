'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Gift, CheckCircle2 } from 'lucide-react'

export default function ClaimEventPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setNeedsAuth(true)
      }
      setLoading(false)
    }
    check()
  }, [])

  const handleClaim = async () => {
    setClaiming(true)
    setError('')
    const { data, error } = await supabase.rpc('claim_event', { token })
    setClaiming(false)

    if (error) { setError(error.message); return }
    setEventId(data as string)
    setClaimed(true)
  }

  const handleSignInToClaim = () => {
    router.push(`/auth/login?redirect=/claim/${token}`)
  }

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="app-container flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-serif text-2xl text-navy-500 mb-2">You're all set!</h1>
        <p className="text-sm text-smoke-500 max-w-xs mb-6">
          Your event is now ready. You can invite guests and manage everything yourself.
        </p>
        <button
          onClick={() => router.push(`/dashboard/${eventId}`)}
          className="h-12 px-6 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600"
        >
          Go to my event
        </button>
      </div>
    )
  }

  return (
    <div className="app-container flex flex-col">
      <div className="bg-brand-500 px-6 pt-12 pb-16 rounded-b-[32px] safe-area-inset-top">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="font-serif text-xl text-white">Occasions</span>
        </div>
        <h1 className="font-serif text-3xl text-white mb-2">An event was prepared for you</h1>
        <p className="text-brand-100 text-sm">Your event manager has set everything up. Claim it to take over.</p>
      </div>

      <div className="px-6 py-8 flex-1 flex flex-col">
        <div className="bg-beige-50 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-navy-500 mb-1">What happens next?</h3>
              <p className="text-xs text-smoke-500 leading-relaxed">
                Once you claim this event, you become the only person who can see the photos and videos guests upload.
                Your event manager will not have access to any media.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {needsAuth ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignInToClaim}
              className="h-12 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600"
            >
              Sign in to claim event
            </button>
            <button
              onClick={() => router.push(`/auth/signup?redirect=/claim/${token}`)}
              className="h-12 bg-white border border-smoke-100 text-navy-500 font-medium rounded-xl hover:border-smoke-300"
            >
              Create an account
            </button>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="h-12 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 disabled:opacity-50"
          >
            {claiming ? 'Claiming...' : 'Claim this event'}
          </button>
        )}
      </div>
    </div>
  )
}

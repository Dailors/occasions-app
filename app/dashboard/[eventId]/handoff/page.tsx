'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Share2, ArrowLeft } from 'lucide-react'

export default function HandoffPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('events').select('id, couple_names, claim_token, claimed_at')
        .eq('id', eventId).single()
      setEvent(data)
      setLoading(false)
    }
    load()
  }, [eventId])

  if (loading) return (
    <div className="app-container flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!event) return (
    <div className="app-container flex items-center justify-center p-6 text-center">
      <p className="text-smoke-500">Event not found</p>
    </div>
  )

  const claimUrl = `${window.location.origin}/claim/${event.claim_token}`
  const waMessage = encodeURIComponent(
    `Hi! Your event "${event.couple_names}" has been set up on Occasions. Click the link to claim it and start inviting guests:\n\n${claimUrl}`
  )

  const copy = async () => {
    await navigator.clipboard.writeText(claimUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="app-container min-h-screen bg-beige-50">
      <div className="sticky top-0 bg-white border-b border-smoke-100 px-4 h-14 flex items-center safe-area-inset-top">
        <Link href="/dashboard" className="flex items-center gap-2 text-navy-500 !min-h-0">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      <div className="px-6 py-8">
        {event.claimed_at ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="font-serif text-xl text-navy-500 mb-2">Event already claimed</h1>
            <p className="text-sm text-smoke-500">The host has taken over this event.</p>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-2xl text-navy-500 mb-2">Hand off to {event.couple_names}</h1>
            <p className="text-sm text-smoke-500 mb-8">
              Send this link to the host. Once they claim it, they become the owner and you'll no longer have access to the media.
            </p>

            <div className="bg-white rounded-2xl border border-smoke-100 p-4 mb-4">
              <label className="text-xs text-smoke-500 mb-2 block">Claim link</label>
              <div className="text-sm text-navy-500 font-mono break-all mb-3">{claimUrl}</div>
              <button
                onClick={copy}
                className="w-full h-11 flex items-center justify-center gap-2 bg-brand-500 text-white rounded-xl font-medium text-sm hover:bg-brand-600"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            <a
              href={`https://wa.me/?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="w-full h-12 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Send via WhatsApp
            </a>

            <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>Reminder:</strong> After the host claims this event, only they will be able to see the photos and QR codes. You'll still see event stats (guest count, date) for your records.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

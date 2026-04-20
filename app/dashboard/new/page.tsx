'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<'host' | 'manager'>('host')
  const [coupleNames, setCoupleNames] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [location, setLocation] = useState('')
  const [womenPin, setWomenPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setRole(profile?.role === 'manager' ? 'manager' : 'host')
    }
    loadRole()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Deduct a credit (placeholder for real payment)
    const { data: creditOk } = await supabase.rpc('use_credit')
    if (!creditOk) {
      setError('Not enough credits. Please buy more to create an event.')
      setLoading(false)
      return
    }

    // Create event
    const eventData: any = {
      couple_names: coupleNames,
      wedding_date: weddingDate || null,
      location: location || null,
      status: 'active',
    }

    if (role === 'manager') {
      eventData.created_by_manager = user.id
      // Manager creates without admin_id — claimed later by host
      eventData.admin_id = user.id  // placeholder until claimed
    } else {
      eventData.admin_id = user.id
      eventData.claimed_at = new Date().toISOString()  // auto-claimed for direct hosts
    }

    const { data: event, error: evErr } = await supabase
      .from('events').insert(eventData).select().single()

    if (evErr) { setError(evErr.message); setLoading(false); return }

    // Create 3 default albums
    const albums = [
      { event_id: event.id, name: 'All guests', type: 'mixed' },
      { event_id: event.id, name: 'Men', type: 'men' },
      { event_id: event.id, name: 'Women', type: 'women', pin_code: womenPin || null },
    ]
    await supabase.from('albums').insert(albums)

    setLoading(false)

    if (role === 'manager') {
      router.push(`/dashboard/${event.id}/handoff`)
    } else {
      router.push(`/dashboard/${event.id}`)
    }
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
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-brand-500" />
          <h1 className="font-serif text-2xl text-navy-500">New event</h1>
        </div>

        {role === 'manager' && (
          <div className="bg-brand-50 rounded-xl p-4 mb-6 text-xs text-brand-700">
            You're creating this event as a manager. After creation, you'll get a claim link to send to the host.
            Once claimed, you'll no longer see photos or QR codes.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-smoke-700 mb-1.5 block">
              {role === 'manager' ? 'Client / Couple name' : 'Couple name or event title'} *
            </label>
            <input
              required
              value={coupleNames}
              onChange={(e) => setCoupleNames(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-smoke-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none bg-white"
              placeholder="e.g. Sarah & Ahmed"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-smoke-700 mb-1.5 block">Event date</label>
            <input
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-smoke-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-smoke-700 mb-1.5 block">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-smoke-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none bg-white"
              placeholder="e.g. Riyadh"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-smoke-700 mb-1.5 block">
              Women's album PIN (optional)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]*"
              value={womenPin}
              onChange={(e) => setWomenPin(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 px-4 rounded-xl border border-smoke-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none bg-white"
              placeholder="3-6 digits"
            />
            <p className="text-xs text-smoke-500 mt-1">
              Guests will need this PIN to access the women-only album.
            </p>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating...' : 'Create event (uses 1 credit)'}
          </button>
        </form>
      </div>
    </div>
  )
}

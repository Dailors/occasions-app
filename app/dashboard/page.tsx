'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, CalendarX, Sparkles, Menu, X, LogOut, CreditCard, FileText, Shield } from 'lucide-react'

interface EventSummary {
  id: string
  couple_names: string
  wedding_date: string | null
  status: string
  guest_count: number
  media_count: number
  claimed_at?: string | null
  claim_token?: string
}

export default function DashboardPage() {
  const [events,  setEvents]  = useState<EventSummary[]>([])
  const [name,    setName]    = useState('')
  const [role,    setRole]    = useState<'host' | 'manager'>('host')
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }

      const { data: profile } = await supabase
        .from('profiles').select('full_name, role, credits').eq('id', user.id).single()

      setName(profile?.full_name?.split(' ')[0] ?? '')
      setRole(profile?.role === 'manager' ? 'manager' : 'host')
      setCredits(profile?.credits ?? 0)

      // Managers see their managed events; hosts see events they own
      const viewName = profile?.role === 'manager' ? 'manager_event_summary' : 'event_summary'
      const { data: ev } = await supabase.from(viewName).select('*').order('created_at', { ascending: false })
      setEvents(ev ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="app-container min-h-screen bg-beige-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-smoke-100 px-4 h-14 flex items-center justify-between safe-area-inset-top">
        <button
          onClick={() => setMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-navy-500 !min-h-0"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span className="font-serif text-lg text-navy-500">Occasions</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Slide-out sidebar */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-navy-500/40 z-40 animate-in fade-in duration-200"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-[75%] max-w-[360px] bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col safe-area-inset-top">
            <div className="p-5 border-b border-smoke-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                <span className="font-serif text-xl text-navy-500">Occasions</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-smoke-500 !min-h-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="font-medium text-navy-500">{name || 'Hello'}</div>
              <div className="text-xs text-smoke-500 mt-0.5 capitalize">{role}</div>
            </div>

            <div className="px-3 flex-1 overflow-y-auto">
              {role === 'manager' && (
                <div className="mb-4 mx-2 p-3 rounded-xl bg-brand-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-brand-600">Credits</div>
                    <div className="text-xl font-bold text-brand-600">{credits}</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-brand-500" />
                </div>
              )}

              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-500 hover:bg-beige-50"
                onClick={() => setMenuOpen(false)}
              >
                <CalendarX className="w-4 h-4" />
                <span className="text-sm">Events</span>
              </Link>
              <Link
                href="/terms"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-500 hover:bg-beige-50"
                onClick={() => setMenuOpen(false)}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">Terms & Conditions</span>
              </Link>
              <Link
                href="/privacy"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-500 hover:bg-beige-50"
                onClick={() => setMenuOpen(false)}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Privacy Policy</span>
              </Link>
            </div>

            <div className="p-3 border-t border-smoke-100">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-navy-500">
            Hi{name ? `, ${name}` : ''}
          </h1>
          <p className="text-sm text-smoke-500 mt-1">
            {events.length === 0
              ? role === 'manager'
                ? 'Create an event for your client.'
                : 'Create your first event.'
              : `${events.length} event${events.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-2 w-full h-12 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors mb-6"
        >
          <Plus className="w-4 h-4" />
          Create new event
        </Link>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center">
              <CalendarX className="w-6 h-6 text-beige-600" />
            </div>
            <div>
              <p className="font-medium text-navy-500">No events yet</p>
              <p className="text-sm text-smoke-500 mt-1">Create one to start collecting memories.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map(event => (
              <EventRow key={event.id} event={event} isManager={role === 'manager'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventRow({ event, isManager }: { event: EventSummary; isManager: boolean }) {
  const needsClaim = isManager && !event.claimed_at

  if (needsClaim) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            Awaiting host
          </span>
        </div>
        <h3 className="font-semibold text-navy-500 mb-1">{event.couple_names}</h3>
        {event.wedding_date && (
          <p className="text-xs text-smoke-500 mb-3">{event.wedding_date}</p>
        )}
        <Link
          href={`/dashboard/${event.id}/handoff`}
          className="text-xs text-brand-500 font-medium"
        >
          Send claim link to host →
        </Link>
      </div>
    )
  }

  return (
    <Link href={`/dashboard/${event.id}`}>
      <div className="bg-white rounded-2xl border border-smoke-100 p-4 hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-navy-500 flex-1 truncate">{event.couple_names}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            event.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-smoke-100 text-smoke-700'
          }`}>
            {event.status}
          </span>
        </div>
        {event.wedding_date && (
          <p className="text-xs text-smoke-500 mb-2">{event.wedding_date}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-smoke-500">
          {!isManager && <span>{event.media_count} files</span>}
          <span>{event.guest_count} guests</span>
        </div>
      </div>
    </Link>
  )
}

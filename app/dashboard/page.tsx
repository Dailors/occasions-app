'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import { formatDate } from '@/lib/utils'
import { Plus, CalendarX, Sparkles, Menu, X, LogOut, CreditCard, FileText, Shield, Calendar, Users } from 'lucide-react'

interface EventSummary {
  id: string
  couple_names: string
  wedding_date: string | null
  status: string
  guest_count: number
  media_count: number
  claimed_at?: string | null
}

export default function DashboardPage() {
  const { t, dir, lang } = useI18n()
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
    return <div className="app-container flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="app-container" dir={dir}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center justify-between safe-area-inset-top">
        <button onClick={() => setMenuOpen(true)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-beige-400" />
          <span className="font-serif text-lg text-white">{t('app.name')}</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-navy-500/60 z-40 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} bottom-0 w-[75%] max-w-[320px] bg-beige-50 z-50 shadow-2xl animate-slide-in-left flex flex-col safe-area-inset-top`}>
            <div className="p-5 border-b border-beige-200 bg-navy-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-beige-400" />
                <span className="font-serif text-xl text-white">{t('app.name')}</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-beige-100">
              <div className="font-semibold text-navy-500">{name || t('dash.hi')}</div>
              <div className="text-xs text-smoke-500 mt-0.5 capitalize">
                {role === 'manager' ? t('auth.role_manager') : t('auth.role_host')}
              </div>
            </div>

            <div className="px-3 py-3 flex-1 overflow-y-auto">
              <Link href="/dashboard/credits" className="flex items-center gap-3 mx-2 mb-3 p-3 rounded-xl bg-brand-500 text-white" onClick={() => setMenuOpen(false)}>
                <CreditCard className="w-4 h-4" />
                <div className="flex-1">
                  <div className="text-xs opacity-80">{t('dash.credits')}</div>
                  <div className="text-lg font-bold">{credits}</div>
                </div>
                <div className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{t('dash.buy_credits')}</div>
              </Link>

              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <Calendar className="w-4 h-4 text-brand-500" />
                <span className="text-sm">{t('dash.my_events')}</span>
              </Link>

              <LanguageToggle />

              <Link href="/terms" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <FileText className="w-4 h-4 text-brand-500" />
                <span className="text-sm">{t('legal.terms_title')}</span>
              </Link>
              <Link href="/privacy" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <Shield className="w-4 h-4 text-brand-500" />
                <span className="text-sm">{t('legal.privacy_title')}</span>
              </Link>
            </div>

            <div className="p-3 border-t border-beige-200">
              <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">{t('auth.sign_out')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <h1 className="font-serif text-2xl text-white mb-1">
          {t('dash.hi')}{name ? `, ${name}` : ''}
        </h1>
        <p className="text-sm text-brand-100">
          {role === 'manager'
            ? `${credits} ${t('dash.credits').toLowerCase()}`
            : events.length === 0 ? t('dash.no_events_desc') : `${events.length} ${t('dash.my_events').toLowerCase()}`}
        </p>
      </div>

      <div className="px-5 py-5 -mt-5">
        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-2 w-full h-12 bg-navy-500 text-white font-medium rounded-2xl hover:bg-navy-600 transition-colors mb-4 shadow-lg shadow-navy-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('dash.create_new_event')}
        </Link>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center card-warm rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-beige-200 flex items-center justify-center">
              <CalendarX className="w-6 h-6 text-beige-600" />
            </div>
            <div>
              <p className="font-medium text-navy-500">{t('dash.no_events')}</p>
              <p className="text-sm text-smoke-500 mt-1">{t('dash.no_events_desc')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map(event => (
              <EventRow key={event.id} event={event} isManager={role === 'manager'} t={t} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventRow({ event, isManager, t, lang }: any) {
  const needsClaim = isManager && !event.claimed_at
  if (needsClaim) {
    return (
      <Link href={`/dashboard/${event.id}/handoff`}>
        <div className="card-warm rounded-2xl p-4 border-amber-200">
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            {t('dash.awaiting_host')}
          </span>
          <h3 className="font-semibold text-navy-500 mt-2">{event.couple_names}</h3>
          {event.wedding_date && <p className="text-xs text-smoke-500">{formatDate(event.wedding_date)}</p>}
          <p className="text-xs text-brand-500 font-medium mt-2">{t('dash.send_claim')}</p>
        </div>
      </Link>
    )
  }
  return (
    <Link href={`/dashboard/${event.id}`}>
      <div className="card-warm rounded-2xl p-4 hover:shadow-lg transition-all">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-navy-500 flex-1 truncate">{event.couple_names}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
            event.status === 'active' ? 'bg-brand-50 text-brand-600' : 'bg-smoke-100 text-smoke-700'
          }`}>{event.status}</span>
        </div>
        {event.wedding_date && <p className="text-xs text-smoke-500 mb-2">{formatDate(event.wedding_date)}</p>}
        <div className="flex items-center gap-4 text-xs text-smoke-700">
          {!isManager && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{event.media_count} {t('dash.files')}</span>}
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.guest_count} {t('dash.guests')}</span>
        </div>
      </div>
    </Link>
  )
}

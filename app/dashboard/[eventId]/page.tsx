'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft, QrCode, Wand2, Clapperboard, Image as ImageIcon, Settings,
  Send, Copy, Check, MessageCircle, Users, Camera, MapPin, Calendar, Sparkles,
} from 'lucide-react'

export default function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [event,   setEvent]   = useState<any>(null)
  const [albums,  setAlbums]  = useState<any[]>([])
  const [stats,   setStats]   = useState({ media: 0, photos: 0, videos: 0, guests: 0 })
  const [role,    setRole]    = useState<'host' | 'manager'>('host')
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setRole(profile?.role === 'manager' ? 'manager' : 'host')

      const { data: ev } = await supabase
        .from('events')
        .select('id, couple_names, wedding_date, location, status, admin_id, created_by_manager, claim_token, claimed_at')
        .eq('id', eventId).single()
      setEvent(ev)

      const { data: al } = await supabase.from('albums').select('*').eq('event_id', eventId).order('created_at')
      setAlbums(al ?? [])

      const { count: mediaCount } = await supabase.from('media').select('id', { count: 'exact', head: true }).eq('event_id', eventId)
      const { count: photoCount } = await supabase.from('media').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('type', 'photo')
      const { count: videoCount } = await supabase.from('media').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('type', 'video')
      const { count: guestCount } = await supabase.from('event_guests').select('id', { count: 'exact', head: true }).eq('event_id', eventId)

      setStats({
        media:  mediaCount ?? 0,
        photos: photoCount ?? 0,
        videos: videoCount ?? 0,
        guests: guestCount ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [eventId])

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="app-container flex items-center justify-center p-6">
        <p className="text-smoke-500">Event not found</p>
      </div>
    )
  }

  const isManager = role === 'manager' && !event.claimed_at
  const upload = (token: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/upload/${token}` : ''

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const mixedAlbum = albums.find(a => a.type === 'mixed')

  return (
    <div className="app-container min-h-screen" dir={dir}>
      {/* Top nav */}
      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center safe-area-inset-top">
        <Link href="/dashboard" className="flex items-center gap-2 text-white !min-h-0">
          <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium">{t('common.back')}</span>
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-brand-500 px-5 pt-6 pb-12">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-beige-400" />
          <span className="text-xs font-medium text-brand-100 uppercase tracking-wider">{t('event.overview')}</span>
        </div>
        <h1 className="font-serif text-2xl text-white mb-3">{event.couple_names}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-brand-100">
          {event.wedding_date && (
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(event.wedding_date)}</span>
          )}
          {event.location && (
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.location}</span>
          )}
        </div>
      </div>

      <div className="px-5 py-5 -mt-8 flex flex-col gap-4">

        {/* Manager handoff card — only if unclaimed */}
        {isManager && (
          <div className="card-warm rounded-2xl p-5 border-2 border-amber-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                {t('dash.awaiting_host')}
              </span>
            </div>
            <h3 className="font-serif text-lg text-navy-500 mb-2">{t('event.handoff')}</h3>
            <p className="text-sm text-smoke-700 mb-4">
              {lang === 'ar'
                ? 'أرسل هذا الرابط للعميل. بمجرد استلامه، تفقد إمكانية الوصول للصور.'
                : "Send this link to the client. Once they claim it, you lose photo access."}
            </p>
            <Link
              href={`/dashboard/${eventId}/handoff`}
              className="flex items-center justify-center gap-2 w-full h-12 bg-navy-500 text-white font-medium rounded-xl"
            >
              <Send className="w-4 h-4" />
              {t('event.handoff')}
            </Link>
          </div>
        )}

        {/* Stats — only shown for hosts, not managers */}
        {!isManager && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={ImageIcon} label={t('dash.files')} value={stats.media} />
            <StatCard icon={Users} label={t('dash.guests')} value={stats.guests} />
          </div>
        )}

        {/* Guest upload link — hidden from managers */}
        {!isManager && mixedAlbum && (
          <div className="card-warm rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-navy-500">{t('event.upload_url_label')}</h3>
            </div>
            <p className="text-xs text-smoke-500 mb-3">{t('event.share_with_guests')}</p>
            <div className="bg-beige-50 rounded-xl p-3 mb-3 border border-beige-200">
              <p className="text-xs text-navy-500 font-mono break-all">{upload(mixedAlbum.access_token)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copy(upload(mixedAlbum.access_token), 'upload')}
                className="flex items-center justify-center gap-1.5 h-11 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600"
              >
                {copied === 'upload' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'upload' ? t('common.copied') : t('common.copy')}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(upload(mixedAlbum.access_token))}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 h-11 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Action buttons — only for hosts */}
        {!isManager && (
          <div className="grid grid-cols-2 gap-3">
            <ActionTile href={`/dashboard/${eventId}/qr`} icon={QrCode} label={t('event.upload_link')} />
            <ActionTile href={`/dashboard/${eventId}/media`} icon={ImageIcon} label={t('event.media')} />
            <ActionTile href={`/dashboard/${eventId}/stories`} icon={Wand2} label={t('event.ai_stories')} accent />
            <ActionTile href={`/dashboard/${eventId}/videos`} icon={Clapperboard} label={t('event.videos')} accent />
          </div>
        )}

        {/* Settings — always visible */}
        <Link
          href={`/dashboard/${eventId}/settings`}
          className="flex items-center gap-3 card-warm rounded-2xl p-4 hover:shadow-md transition-all"
        >
          <Settings className="w-5 h-5 text-smoke-700" />
          <span className="text-sm font-medium text-navy-500 flex-1">{t('event.settings')}</span>
          <ArrowLeft className={`w-4 h-4 text-smoke-500 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
        </Link>

      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="card-warm rounded-2xl p-4">
      <Icon className="w-4 h-4 text-brand-500 mb-1" />
      <div className="text-2xl font-bold text-navy-500">{value}</div>
      <div className="text-xs text-smoke-500 capitalize">{label}</div>
    </div>
  )
}

function ActionTile({ href, icon: Icon, label, accent }: { href: string; icon: any; label: string; accent?: boolean }) {
  return (
    <Link href={href} className="card-warm rounded-2xl p-4 flex flex-col items-start gap-2 hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-brand-500' : 'bg-beige-200'}`}>
        <Icon className={`w-5 h-5 ${accent ? 'text-white' : 'text-beige-600'}`} />
      </div>
      <span className="text-sm font-medium text-navy-500">{label}</span>
    </Link>
  )
}

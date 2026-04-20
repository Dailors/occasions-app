'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft, Copy, Check, MessageCircle, Printer, Lock,
} from 'lucide-react'

export default function QRPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [event,  setEvent]   = useState<any>(null)
  const [albums, setAlbums]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: ev } = await supabase.from('events').select('id, couple_names').eq('id', eventId).single()
      setEvent(ev)
      const { data: al } = await supabase.from('albums').select('*').eq('event_id', eventId).order('created_at')
      setAlbums(al ?? [])
      setLoading(false)
    }
    load()
  }, [eventId])

  const uploadUrl = (token: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/upload/${token}` : ''

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  if (loading) {
    return <div className="app-container flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const albumLabels: Record<string, string> = {
    mixed: t('album.mixed'),
    men:   t('album.men'),
    women: t('album.women'),
  }
  const albumIcons: Record<string, string> = {
    mixed: '📸',
    men:   '🤵',
    women: '👰',
  }

  return (
    <div className="app-container min-h-screen" dir={dir}>
      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center justify-between safe-area-inset-top print:hidden">
        <Link href={`/dashboard/${eventId}`} className="flex items-center gap-2 text-white !min-h-0">
          <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium">{t('common.back')}</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-white text-sm font-medium !min-h-0"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      <div className="bg-brand-500 px-5 pt-6 pb-10 print:bg-white print:text-black">
        <h1 className="font-serif text-2xl text-white print:text-navy-500 mb-1">{event?.couple_names}</h1>
        <p className="text-sm text-brand-100 print:text-smoke-500">
          {lang === 'ar' ? 'امسح رمز QR لرفع الصور' : 'Scan QR to upload photos'}
        </p>
      </div>

      <div className="px-5 py-5 -mt-5 flex flex-col gap-4 print:gap-6">
        {albums.map(album => (
          <div key={album.id} className="card-warm rounded-2xl p-5 print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{albumIcons[album.type]}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-navy-500">{albumLabels[album.type]}</h3>
                {album.pin_code && (
                  <div className="flex items-center gap-1 text-xs text-amber-700">
                    <Lock className="w-3 h-3" />
                    {lang === 'ar' ? `رمز: ${album.pin_code}` : `PIN: ${album.pin_code}`}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center bg-white p-4 rounded-xl border border-beige-200 mb-3">
              <QRCodeSVG
                value={uploadUrl(album.access_token)}
                size={180}
                level="H"
                fgColor="#22303f"
              />
            </div>

            <div className="bg-beige-50 rounded-lg p-2 mb-3 border border-beige-200 print:hidden">
              <p className="text-[10px] text-navy-500 font-mono break-all text-center">{uploadUrl(album.access_token)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={() => copy(uploadUrl(album.access_token), album.id)}
                className="flex items-center justify-center gap-1.5 h-11 bg-brand-500 text-white text-sm font-medium rounded-xl"
              >
                {copiedId === album.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedId === album.id ? t('common.copied') : t('common.copy')}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(uploadUrl(album.access_token))}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 h-11 bg-green-500 text-white text-sm font-medium rounded-xl"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 1cm; }
          body { background: white !important; }
          .app-container { box-shadow: none !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}

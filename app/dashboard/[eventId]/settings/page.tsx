'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { Lock, Check, Trash2, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [albums, setAlbums] = useState<any[]>([])
  const [womenPin, setWomenPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single()
      setEvent(ev)
      const { data: al } = await supabase.from('albums').select('*').eq('event_id', eventId)
      setAlbums(al ?? [])
      const women = (al ?? []).find((a: any) => a.type === 'women')
      if (women?.pin_code) setWomenPin(women.pin_code)
      setLoading(false)
    }
    load()
  }, [eventId])

  const saveWomenPin = async () => {
    setSaving(true)
    const women = albums.find(a => a.type === 'women')
    if (women) {
      await supabase.from('albums').update({ pin_code: womenPin || null }).eq('id', women.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const closeEvent = async () => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return
    await supabase.from('events').update({ status: 'closed' }).eq('id', eventId)
    alert(lang === 'ar' ? 'تم إغلاق المناسبة' : 'Event closed')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div dir={dir}>
      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <h1 className="font-serif text-2xl text-white">{t('event.settings')}</h1>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="bg-beige-50 border border-beige-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-navy-500">{t('event.women_pin')}</h3>
          </div>
          <p className="text-xs text-smoke-500 mb-4">
            {lang === 'ar' ? 'سيُطلب هذا الرمز من الضيوف ومنك لدخول ألبوم النساء.' : "This PIN is required from guests AND from you to view the women's album."}
          </p>
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" maxLength={6} value={womenPin}
              onChange={(e) => setWomenPin(e.target.value.replace(/\D/g, ''))}
              className="flex-1 h-12 px-4 rounded-xl border border-smoke-100 focus:border-brand-500 outline-none text-center text-lg tracking-widest font-mono bg-white"
              placeholder="••••" />
            <button onClick={saveWomenPin} disabled={saving}
              className="h-12 px-5 bg-brand-500 text-white font-medium rounded-xl disabled:opacity-50">
              {saved ? <Check className="w-4 h-4" /> : saving ? '...' : t('common.save')}
            </button>
          </div>
          <p className="text-xs text-amber-700 mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {lang === 'ar' ? 'ملاحظة: لن تتمكن من عرض الألبوم بدون هذا الرمز.' : "Note: You won't be able to view the album without this PIN."}
          </p>
        </div>

        <div className="bg-beige-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-navy-500">Danger zone</h3>
          </div>
          <p className="text-xs text-smoke-500 mb-4">
            {lang === 'ar' ? 'إغلاق المناسبة يوقف الرفع الجديد.' : 'Closing an event stops new uploads.'}
          </p>
          <button onClick={closeEvent} className="w-full h-11 bg-red-500 text-white rounded-xl font-medium">
            {lang === 'ar' ? 'إغلاق المناسبة' : 'Close event'}
          </button>
        </div>
      </div>
    </div>
  )
}

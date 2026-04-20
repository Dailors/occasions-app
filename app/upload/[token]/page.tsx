'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import {
  Camera, Upload, CheckCircle2, Sparkles, Lock, Wifi, WifiOff, X,
} from 'lucide-react'

export default function GuestUploadPage() {
  const { token } = useParams<{ token: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading]   = useState(true)
  const [event,   setEvent]     = useState<any>(null)
  const [album,   setAlbum]     = useState<any>(null)
  const [pinRequired, setPinRequired] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [myUploads, setMyUploads] = useState<any[]>([])
  const [queue, setQueue]       = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [offline, setOffline]   = useState(false)

  useEffect(() => {
    const join = async () => {
      // Sign in anonymously if needed
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = `/auth/guest?token=${token}`
        return
      }

      // Join album via API
      const res = await fetch('/api/join-album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (data.error) {
        if (data.error.includes('PIN')) {
          setPinRequired(true)
          setEvent(data.event)
          setAlbum(data.album)
        }
        setLoading(false)
        return
      }

      setEvent(data.event)
      setAlbum(data.album)
      loadMyUploads(data.album.id)
      setLoading(false)
    }
    join()

    const handleOffline = () => setOffline(true)
    const handleOnline  = () => setOffline(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)
    if (!navigator.onLine) setOffline(true)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [token])

  const loadMyUploads = async (albumId: string) => {
    const { data } = await supabase
      .from('media')
      .select('id, url_original, url_compressed, type')
      .eq('album_id', albumId)
      .order('uploaded_at', { ascending: false })

    const withUrls = await Promise.all((data ?? []).map(async (m: any) => {
      const bucket = m.url_compressed ? 'media-compressed' : 'media-originals'
      const path   = m.url_compressed ?? m.url_original
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
      return { ...m, preview_url: signed?.signedUrl }
    }))
    setMyUploads(withUrls)
  }

  const verifyPin = async () => {
    setPinError('')
    const res = await fetch('/api/join-album', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, pin: pinInput }),
    })
    const data = await res.json()
    if (data.error) { setPinError(data.error); return }
    setPinRequired(false)
    setEvent(data.event)
    setAlbum(data.album)
    loadMyUploads(data.album.id)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    setQueue(prev => [...prev, ...Array.from(files)])
  }

  const removeFromQueue = (idx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadAll = async () => {
    setUploading(true)
    for (const file of queue) {
      const form = new FormData()
      form.append('file', file)
      form.append('album_id', album.id)
      form.append('event_id', event.id)
      try {
        await fetch('/api/upload', { method: 'POST', body: form })
      } catch (e) { console.error(e) }
    }
    setQueue([])
    setUploading(false)
    loadMyUploads(album.id)
  }

  if (loading) {
    return <div className="app-container flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (pinRequired) {
    return (
      <div className="app-container flex flex-col" dir={dir}>
        <div className="bg-brand-500 px-6 pt-12 pb-16 rounded-b-[32px]">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-5 h-5 text-beige-400" />
            <span className="font-serif text-xl text-white">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-white" />
            <h1 className="font-serif text-2xl text-white">{t('album.enter_pin')}</h1>
          </div>
          <p className="text-brand-100 text-sm">{event?.couple_names}</p>
        </div>

        <div className="px-6 py-8">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            className="w-full h-14 px-4 rounded-xl border-2 border-smoke-100 focus:border-brand-500 outline-none text-center text-2xl tracking-widest font-mono bg-white"
            placeholder="••••"
            autoFocus
          />
          {pinError && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-4">{pinError}</div>}
          <button
            onClick={verifyPin}
            disabled={pinInput.length < 3}
            className="w-full h-12 bg-brand-500 text-white font-medium rounded-xl mt-6 disabled:opacity-50"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container min-h-screen flex flex-col" dir={dir}>
      {offline && (
        <div className="bg-red-500 text-white text-center py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          {lang === 'ar' ? 'لا يوجد إنترنت' : 'No internet connection'}
        </div>
      )}

      <div className="bg-brand-500 px-6 pt-10 pb-10 safe-area-inset-top">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-beige-400" />
          <span className="font-serif text-sm text-white">{t('app.name')}</span>
        </div>
        <h1 className="font-serif text-2xl text-white mb-1">{event?.couple_names}</h1>
        <p className="text-brand-100 text-sm">{album?.name}</p>
      </div>

      <div className="px-5 py-5 -mt-5 flex-1 flex flex-col gap-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="card-warm rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-brand-300 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-navy-500">
              {lang === 'ar' ? 'اضغط لإضافة صور' : 'Tap to add photos'}
            </p>
            <p className="text-xs text-smoke-500 mt-1">
              {lang === 'ar' ? 'أو فيديوهات' : 'or videos'}
            </p>
          </div>
        </button>

        {queue.length > 0 && (
          <div className="card-warm rounded-2xl p-4">
            <p className="text-sm font-semibold text-navy-500 mb-3">
              {queue.length} {lang === 'ar' ? 'جاهز للرفع' : 'ready to upload'}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {queue.map((f, i) => (
                <div key={i} className="relative">
                  <div className="w-14 h-14 rounded-lg bg-beige-200 flex items-center justify-center text-xs text-beige-600">
                    {f.name.slice(0, 8)}
                  </div>
                  <button
                    onClick={() => removeFromQueue(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center !min-h-0"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={uploadAll}
              disabled={uploading || offline}
              className="w-full h-11 bg-navy-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'رفع الكل' : 'Upload all')}
            </button>
          </div>
        )}

        {myUploads.length > 0 && (
          <div>
            <h3 className="font-semibold text-navy-500 mb-3">
              {lang === 'ar' ? 'ما رفعته' : 'Your uploads'} ({myUploads.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {myUploads.map(m => (
                <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-beige-200">
                  {m.preview_url && m.type === 'photo' && (
                    <img src={m.preview_url} alt="" className="w-full h-full object-cover" />
                  )}
                  {m.preview_url && m.type === 'video' && (
                    <video src={m.preview_url} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-smoke-500 text-center mt-auto pt-8">
          {lang === 'ar' ? 'رفوعاتك خاصة. فقط المضيف يراها.' : 'Your uploads are private. Only the host can see them.'}
        </p>
      </div>
    </div>
  )
}

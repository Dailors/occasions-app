'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { compressImage, extractVideoFrame } from '@/lib/compress'
import {
  Camera, Upload, Sparkles, Lock, WifiOff, X, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react'

type FileStatus = 'queued' | 'compressing' | 'uploading' | 'done' | 'failed'
interface QueuedFile { file: File; status: FileStatus; error?: string; progress?: number }

export default function GuestUploadPage() {
  const { token } = useParams<{ token: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading]         = useState(true)
  const [initError, setInitError]     = useState('')
  const [event, setEvent]             = useState<any>(null)
  const [album, setAlbum]             = useState<any>(null)
  const [pinRequired, setPinRequired] = useState(false)
  const [pinInput, setPinInput]       = useState('')
  const [pinError, setPinError]       = useState('')
  const [myUploads, setMyUploads]     = useState<any[]>([])
  const [queue, setQueue]             = useState<QueuedFile[]>([])
  const [offline, setOffline]         = useState(false)

  useEffect(() => {
    init()
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    if (!navigator.onLine) setOffline(true)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [token])

  const init = async () => {
    setLoading(true); setInitError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { error: anonError } = await supabase.auth.signInAnonymously()
        if (anonError) { setInitError('Could not sign in: ' + anonError.message); setLoading(false); return }
      }

      const res = await fetch('/api/join-album', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (data.error === 'PIN required') {
        setPinRequired(true); setEvent(data.event); setAlbum(data.album); setLoading(false); return
      }
      if (data.error) { setInitError(data.error); setLoading(false); return }
      if (!data.event || !data.album) { setInitError('Invalid response'); setLoading(false); return }

      setEvent(data.event); setAlbum(data.album)
      await loadMyUploads(data.album.id)
    } catch (err: any) {
      setInitError('Connection failed: ' + (err.message ?? 'Unknown'))
    }
    setLoading(false)
  }

  const loadMyUploads = async (albumId: string) => {
    try {
      const { data } = await supabase.from('media')
        .select('id, url_original, url_compressed, type, uploaded_at')
        .eq('album_id', albumId).order('uploaded_at', { ascending: false }).limit(30)

      const withUrls = await Promise.all((data ?? []).map(async (m: any) => {
        const bucket = m.url_compressed ? 'media-compressed' : 'media-originals'
        const path = m.url_compressed ?? m.url_original
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
        return { ...m, preview_url: signed?.signedUrl }
      }))
      setMyUploads(withUrls)
    } catch (err) { console.error(err) }
  }

  const verifyPin = async () => {
    setPinError('')
    try {
      const res = await fetch('/api/join-album', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin: pinInput }),
      })
      const data = await res.json()
      if (data.error) { setPinError(data.error); return }
      setPinRequired(false); setEvent(data.event); setAlbum(data.album)
      await loadMyUploads(data.album.id)
    } catch (err: any) { setPinError('Connection failed') }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    const arr: QueuedFile[] = Array.from(files).map(file => ({ file, status: 'queued' }))
    setQueue(prev => [...prev, ...arr])
  }

  const removeFromQueue = (idx: number) => setQueue(prev => prev.filter((_, i) => i !== idx))

  const uploadAll = async () => {
    if (!album?.id || !event?.id) { alert('Not ready. Reload page.'); return }

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      if (item.status === 'done') continue

      // COMPRESS STAGE
      setQueue(prev => prev.map((q, j) => j === i ? { ...q, status: 'compressing', error: undefined } : q))

      const form = new FormData()
      form.append('album_id', album.id)
      form.append('event_id', event.id)

      try {
        if (item.file.type.startsWith('image/')) {
          // Photo — compress for preview, upload both
          const { original, compressed } = await compressImage(item.file, 1200, 0.82)
          form.append('file', original)
          if (compressed) form.append('compressed', compressed, 'preview.jpg')
        } else if (item.file.type.startsWith('video/')) {
          // Video — extract keyframe as preview
          form.append('file', item.file)
          const frame = await extractVideoFrame(item.file)
          if (frame) form.append('compressed', frame, 'keyframe.jpg')
        } else {
          form.append('file', item.file)
        }

        // UPLOAD STAGE
        setQueue(prev => prev.map((q, j) => j === i ? { ...q, status: 'uploading' } : q))

        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()

        if (data.error || !res.ok) {
          setQueue(prev => prev.map((q, j) => j === i ? { ...q, status: 'failed', error: data.error ?? 'Upload failed' } : q))
        } else {
          setQueue(prev => prev.map((q, j) => j === i ? { ...q, status: 'done' } : q))
        }
      } catch (err: any) {
        setQueue(prev => prev.map((q, j) => j === i ? { ...q, status: 'failed', error: err.message ?? 'Error' } : q))
      }
    }

    await loadMyUploads(album.id)
  }

  const clearDone = () => setQueue(prev => prev.filter(q => q.status !== 'done'))

  if (loading) return <div className="app-container flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  if (initError) {
    return (
      <div className="app-container flex flex-col items-center justify-center p-6 gap-4 text-center" dir={dir}>
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center"><AlertCircle className="w-7 h-7 text-red-500" /></div>
        <p className="font-semibold text-navy-500">{lang === 'ar' ? 'حدث خطأ' : 'Something went wrong'}</p>
        <p className="text-sm text-smoke-700">{initError}</p>
        <button onClick={init} className="h-11 px-5 bg-brand-500 text-white rounded-xl font-medium">
          {lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}
        </button>
      </div>
    )
  }

  if (pinRequired) {
    return (
      <div className="app-container flex flex-col" dir={dir}>
        <div className="bg-brand-500 px-6 pt-12 pb-16 rounded-b-[32px]">
          <div className="flex items-center gap-2 mb-8"><Sparkles className="w-5 h-5 text-beige-400" /><span className="font-serif text-xl text-white">{t('app.name')}</span></div>
          <div className="flex items-center gap-2 mb-2"><Lock className="w-5 h-5 text-white" /><h1 className="font-serif text-2xl text-white">{t('album.enter_pin')}</h1></div>
          <p className="text-brand-100 text-sm">{event?.couple_names}</p>
        </div>
        <div className="px-6 py-8">
          <input type="text" inputMode="numeric" maxLength={6} value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            className="w-full h-14 px-4 rounded-xl border-2 border-smoke-100 focus:border-brand-500 outline-none text-center text-2xl tracking-widest font-mono bg-white"
            placeholder="••••" autoFocus />
          {pinError && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-4">{pinError}</div>}
          <button onClick={verifyPin} disabled={pinInput.length < 3}
            className="w-full h-12 bg-brand-500 text-white font-medium rounded-xl mt-6 disabled:opacity-50">
            {t('common.continue')}
          </button>
        </div>
      </div>
    )
  }

  const doneCount = queue.filter(q => q.status === 'done').length
  const busyCount = queue.filter(q => q.status === 'compressing' || q.status === 'uploading').length
  const queuedCount = queue.filter(q => q.status === 'queued' || q.status === 'failed').length

  return (
    <div className="app-container min-h-screen flex flex-col" dir={dir}>
      {offline && (
        <div className="bg-red-500 text-white text-center py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />{lang === 'ar' ? 'لا يوجد إنترنت' : 'No internet'}
        </div>
      )}

      <div className="bg-brand-500 px-6 pt-10 pb-10 safe-area-inset-top">
        <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-beige-400" /><span className="font-serif text-sm text-white">{t('app.name')}</span></div>
        <h1 className="font-serif text-2xl text-white mb-1">{event?.couple_names}</h1>
        <p className="text-brand-100 text-sm">{album?.name}</p>
      </div>

      <div className="px-5 py-5 -mt-5 flex-1 flex flex-col gap-4">
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />

        <button onClick={() => fileRef.current?.click()}
          className="bg-white border-2 border-dashed border-beige-400 rounded-2xl p-8 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center"><Camera className="w-7 h-7 text-white" /></div>
          <div className="text-center">
            <p className="font-semibold text-navy-500">{lang === 'ar' ? 'اضغط لإضافة صور أو فيديوهات' : 'Tap to add photos or videos'}</p>
            <p className="text-xs text-smoke-500 mt-1">{lang === 'ar' ? 'من المعرض أو الكاميرا' : 'from gallery or camera'}</p>
          </div>
        </button>

        {queue.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-beige-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-navy-500">
                {queue.length} {lang === 'ar' ? 'ملف' : 'file(s)'}
                {doneCount > 0 && <span className="text-green-600 ml-1">· {doneCount} ✓</span>}
              </p>
              {doneCount > 0 && <button onClick={clearDone} className="text-xs text-brand-500 !min-h-0 p-0">{lang === 'ar' ? 'مسح المنتهية' : 'Clear done'}</button>}
            </div>

            <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
              {queue.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-beige-50">
                  <div className="w-9 h-9 rounded-lg bg-beige-200 flex items-center justify-center text-xs flex-shrink-0">
                    {item.file.type.startsWith('video') ? '🎬' : '📷'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-navy-500 truncate">{item.file.name}</p>
                    {item.status === 'compressing' && <p className="text-[10px] text-amber-600">{lang === 'ar' ? 'ضغط...' : 'Optimizing...'}</p>}
                    {item.status === 'uploading' && <p className="text-[10px] text-brand-500">{lang === 'ar' ? 'رفع...' : 'Uploading...'}</p>}
                    {item.error && <p className="text-[10px] text-red-600">{item.error}</p>}
                  </div>
                  {item.status === 'queued' && <button onClick={() => removeFromQueue(i)} className="w-6 h-6 flex items-center justify-center !min-h-0"><X className="w-4 h-4 text-smoke-500" /></button>}
                  {(item.status === 'compressing' || item.status === 'uploading') && <Loader2 className="w-4 h-4 text-brand-500 animate-spin flex-shrink-0" />}
                  {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  {item.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </div>
              ))}
            </div>

            {queuedCount > 0 && (
              <button onClick={uploadAll} disabled={busyCount > 0 || offline}
                className="w-full h-11 bg-navy-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {busyCount > 0 ? (lang === 'ar' ? 'جاري...' : 'Working...') : (lang === 'ar' ? 'رفع الكل' : 'Upload all')}
              </button>
            )}
          </div>
        )}

        {myUploads.length > 0 && (
          <div>
            <h3 className="font-semibold text-navy-500 mb-3">{lang === 'ar' ? 'ما رفعته' : 'Your uploads'} ({myUploads.length})</h3>
            <div className="grid grid-cols-3 gap-2">
              {myUploads.map(m => (
                <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-beige-200">
                  {m.preview_url && m.type === 'photo' && <img src={m.preview_url} alt="" className="w-full h-full object-cover" />}
                  {m.preview_url && m.type === 'video' && <img src={m.preview_url} alt="" className="w-full h-full object-cover" />}
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

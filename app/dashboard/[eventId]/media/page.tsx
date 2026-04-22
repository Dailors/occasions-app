'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { Lock, Fingerprint, AlertCircle } from 'lucide-react'

export default function MediaPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [albums, setAlbums] = useState<any[]>([])
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [womenPinEntered, setWomenPinEntered] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [canUseBiometric, setCanUseBiometric] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('albums').select('*').eq('event_id', eventId).order('created_at')
      setAlbums(data ?? [])
      const mixed = (data ?? []).find((a: any) => a.type === 'mixed')
      if (mixed) {
        setActiveAlbum(mixed.id)
        loadMedia(mixed.id)
      }
      setLoading(false)
    }
    load()

    // Check if WebAuthn/biometrics are available
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setCanUseBiometric(available))
        .catch(() => setCanUseBiometric(false))
    }
  }, [eventId])

  const loadMedia = async (albumId: string) => {
    const { data } = await supabase.from('media').select('*').eq('album_id', albumId).order('uploaded_at', { ascending: false })
    const withUrls = await Promise.all((data ?? []).map(async (m: any) => {
      const bucket = m.url_compressed ? 'media-compressed' : 'media-originals'
      const path = m.url_compressed ?? m.url_original
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
      return { ...m, preview_url: signed?.signedUrl }
    }))
    setMedia(withUrls)
  }

  const switchAlbum = (album: any) => {
    if (album.type === 'women' && album.pin_code && !womenPinEntered) {
      setActiveAlbum(album.id)
      setMedia([])
      return
    }
    setActiveAlbum(album.id)
    loadMedia(album.id)
  }

  const verifyPin = () => {
    const womenAlbum = albums.find(a => a.type === 'women' && a.id === activeAlbum)
    if (!womenAlbum) return
    if (pinInput === womenAlbum.pin_code) {
      setWomenPinEntered(true)
      setPinInput('')
      setPinError('')
      loadMedia(womenAlbum.id)
    } else {
      setPinError(lang === 'ar' ? 'رمز خاطئ' : 'Wrong PIN')
    }
  }

  const tryBiometric = async () => {
    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
        }
      })
      const womenAlbum = albums.find(a => a.type === 'women' && a.id === activeAlbum)
      if (womenAlbum) {
        setWomenPinEntered(true)
        loadMedia(womenAlbum.id)
      }
    } catch {
      setPinError(lang === 'ar' ? 'فشل التحقق البيومتري' : 'Biometric verification failed')
    }
  }

  const tabs = albums.map(a => ({
    id: a.id, type: a.type,
    label: a.type === 'mixed' ? t('album.mixed') : a.type === 'men' ? t('album.men') : t('album.women'),
    icon: a.type === 'mixed' ? '📸' : a.type === 'men' ? '🤵' : '👰',
  }))

  const activeAlbumObj = albums.find(a => a.id === activeAlbum)
  const needsPin = activeAlbumObj?.type === 'women' && activeAlbumObj?.pin_code && !womenPinEntered

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div dir={dir}>
      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <h1 className="font-serif text-2xl text-white mb-1">{t('event.media')}</h1>
        <p className="text-sm text-brand-100">{media.length} {t('dash.files')}</p>
      </div>

      <div className="px-5 -mt-5">
        <div className="bg-beige-50 rounded-2xl p-1 flex gap-1 border border-beige-200">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => switchAlbum(albums.find(a => a.id === tab.id))}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all !min-h-0 ${
                activeAlbum === tab.id ? 'bg-brand-500 text-white' : 'text-navy-500'
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5">
        {needsPin ? (
          <div className="bg-beige-50 border border-beige-200 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-navy-500 mb-1">{t('album.enter_pin')}</p>
              <p className="text-xs text-smoke-500">
                {lang === 'ar' ? 'ألبوم النساء محمي. أدخل الرمز للعرض.' : "Women's album is protected. Enter PIN to view."}
              </p>
            </div>
            <input type="text" inputMode="numeric" maxLength={6} value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full max-w-[200px] h-14 px-4 rounded-xl border-2 border-smoke-100 focus:border-brand-500 outline-none text-center text-2xl tracking-widest font-mono bg-white"
              placeholder="••••" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && verifyPin()} />
            {pinError && <p className="text-sm text-red-600">{pinError}</p>}
            <button onClick={verifyPin} disabled={pinInput.length < 3}
              className="w-full max-w-[200px] h-11 bg-brand-500 text-white rounded-xl font-medium disabled:opacity-50">
              {t('common.continue')}
            </button>
            {canUseBiometric && (
              <button onClick={tryBiometric} className="flex items-center gap-2 text-sm text-brand-500 font-medium !min-h-0">
                <Fingerprint className="w-4 h-4" />
                {lang === 'ar' ? 'استخدم البصمة' : 'Use biometric'}
              </button>
            )}
          </div>
        ) : media.length === 0 ? (
          <div className="bg-beige-50 border border-beige-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-8 h-8 text-smoke-300 mx-auto mb-2" />
            <p className="font-medium text-navy-500">{lang === 'ar' ? 'لا توجد وسائط بعد' : 'No media yet'}</p>
            <p className="text-sm text-smoke-500 mt-1">
              {lang === 'ar' ? 'عندما يرفع الضيوف صوراً ستظهر هنا.' : 'Uploads from guests will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {media.map(m => (
              <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-beige-200">
                {m.preview_url && m.type === 'photo' && <img src={m.preview_url} alt="" className="w-full h-full object-cover" />}
                {m.preview_url && m.type === 'video' && <video src={m.preview_url} className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

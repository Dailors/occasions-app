'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import {
  renderStory, renderPost, renderPhotoDump, downloadBlob,
  pickPreset, pickIllustration,
  type EnhancementPreset,
} from '@/lib/canvas-renderer'
import {
  Wand2, Loader2, Download, RefreshCw, Sparkles,
  Image as ImageIcon, BookOpen, Grid3X3, Film, ImagePlus,
} from 'lucide-react'

type Kind = 'story' | 'post' | 'photo_dump' | 'video'

interface Package {
  id: string
  format: Kind
  variant: number
  media_ids: string[]
  caption_en: string
  caption_ar: string
  hashtags: string[]
  status: string
  photos?: MediaItem[]
}

interface MediaItem {
  id: string
  url_compressed: string | null
  url_original: string
  category: string | null
  emotion: string | null
  quality_score: number | null
}

const TABS: { id: Kind; label_en: string; label_ar: string; icon: any }[] = [
  { id: 'story',      label_en: 'Stories',     label_ar: 'ستوريز',  icon: BookOpen },
  { id: 'post',       label_en: 'Posts',        label_ar: 'منشورات', icon: ImageIcon },
  { id: 'photo_dump', label_en: 'Photo Dumps',  label_ar: 'ألبوم',   icon: Grid3X3 },
]

export default function AIPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<Kind>('story')
  const [generating, setGenerating] = useState<Kind | null>(null)
  const [rendering, setRendering]   = useState<string | null>(null)
  const [error, setError]           = useState('')
  const [photoCount, setPhotoCount] = useState(0)
  const [untagged, setUntagged]     = useState(0)

  useEffect(() => { load() }, [eventId])

  const load = async () => {
    const { count: total } = await supabase.from('media')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId).eq('type', 'photo')
    setPhotoCount(total ?? 0)

    const { count: tagged } = await supabase.from('media_tags')
      .select('id', { count: 'exact', head: true })
      .in('media_id',
        (await supabase.from('media').select('id').eq('event_id', eventId).eq('type', 'photo')).data?.map((m: any) => m.id) ?? []
      )
    setUntagged((total ?? 0) - (tagged ?? 0))

    const { data: pkgs } = await supabase.from('story_packages')
      .select('*').eq('event_id', eventId)
      .order('created_at', { ascending: false })

    // Hydrate each package with its photo objects
    const hydrated = await Promise.all((pkgs ?? []).map(async (pkg: any) => {
      if (!pkg.media_ids?.length) return { ...pkg, photos: [] }
      const { data: media } = await supabase.from('media_with_tags')
        .select('id, url_compressed, url_original, category, emotion, quality_score')
        .in('id', pkg.media_ids.slice(0, 9))
      return { ...pkg, photos: media ?? [] }
    }))

    setPackages(hydrated)
    setLoading(false)
  }

  const generate = async (kind: Kind) => {
    const existing = packages.filter(p => p.format === kind)
    if (existing.length >= 6) {
      setError(`Max 6 ${kind}s reached. Delete some to generate more.`)
      return
    }
    setError('')
    setGenerating(kind)
    try {
      const res = await fetch(`/api/events/${eventId}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setGenerating(null); return }
      await load()
    } catch (err: any) {
      setError(err.message ?? 'Failed')
    }
    setGenerating(null)
  }

  const retag = async () => {
    await fetch(`/api/events/${eventId}/retag`, { method: 'POST' })
    setTimeout(load, 3000)
  }

  const handleDownloadStory = async (pkg: Package) => {
    if (!pkg.photos?.length) return
    setRendering(pkg.id)
    setError('')
    try {
      const photo = pkg.photos[0]
      const url = getPublicUrl(photo)
      const preset = pickPreset(photo.category ?? undefined, photo.emotion ?? undefined)
      const blob = await renderStory(url, pkg.caption_en, pkg.caption_ar, lang as 'en' | 'ar', preset)
      downloadBlob(blob, `munasaba-story-${pkg.variant}.png`)
    } catch (err: any) {
      setError('Render failed: ' + err.message)
    }
    setRendering(null)
  }

  const handleDownloadPost = async (pkg: Package, index: number) => {
    if (!pkg.photos?.length) return
    setRendering(pkg.id)
    setError('')
    try {
      const photo = pkg.photos[0]
      const url = getPublicUrl(photo)
      const preset = pickPreset(photo.category ?? undefined, photo.emotion ?? undefined)
      const illStyle = pickIllustration(index, photo.category ?? undefined, photo.emotion ?? undefined)
      const blob = await renderPost(url, illStyle, preset)
      downloadBlob(blob, `munasaba-post-${pkg.variant}.png`)
    } catch (err: any) {
      setError('Render failed: ' + err.message)
    }
    setRendering(null)
  }

  const handleDownloadDump = async (pkg: Package) => {
    if (!pkg.photos?.length) return
    setRendering(pkg.id)
    setError('')
    try {
      const urls = pkg.photos.map(getPublicUrl)
      const firstPhoto = pkg.photos[0]
      const preset = pickPreset(firstPhoto.category ?? undefined, firstPhoto.emotion ?? undefined)
      const blob = await renderPhotoDump(urls, pkg.caption_en, pkg.caption_ar, lang as 'en' | 'ar', preset)
      downloadBlob(blob, `munasaba-dump-${pkg.variant}.png`)
    } catch (err: any) {
      setError('Render failed: ' + err.message)
    }
    setRendering(null)
  }

  const visiblePkgs = packages.filter(p => p.format === tab)

  return (
    <div dir={dir}>
      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-beige-400" />
          <h1 className="font-serif text-2xl text-white">
            {lang === 'ar' ? 'مقترحات AI' : 'AI Suggestions'}
          </h1>
        </div>
        <p className="text-sm text-brand-100">
          {lang === 'ar' ? `${photoCount} صورة · AI يختار الأفضل ويصمم تلقائياً` : `${photoCount} photos · AI picks the best & designs automatically`}
        </p>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {untagged > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {lang === 'ar' ? `${untagged} صورة لم تُحلَّل` : `${untagged} photos not analyzed`}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {lang === 'ar' ? 'حلّل الصور للحصول على نتائج أفضل' : 'Analyze for better results'}
              </p>
            </div>
            <button onClick={retag}
              className="h-8 px-3 bg-amber-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 !min-h-0">
              <Sparkles className="w-3 h-3" />
              {lang === 'ar' ? 'تحليل' : 'Analyze'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex bg-beige-100 rounded-xl p-1 gap-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 h-9 rounded-lg text-xs font-medium transition !min-h-0 flex items-center justify-center gap-1 ${tab === t.id ? 'bg-white text-navy-500 shadow-sm' : 'text-smoke-700'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {lang === 'ar' ? t.label_ar : t.label_en}
            </button>
          ))}
        </div>

        {/* Generate button */}
        {photoCount >= 1 && (
          <button onClick={() => generate(tab)} disabled={!!generating}
            className="h-12 w-full bg-navy-500 text-white font-medium rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50">
            {generating === tab
              ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'ar' ? 'جاري التوليد...' : 'Generating...'}</>
              : <><Wand2 className="w-4 h-4" />{lang === 'ar' ? `توليد ${TABS.find(t => t.id === tab)?.label_ar}` : `Generate ${tab}`}</>}
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : visiblePkgs.length === 0 ? (
          <div className="bg-beige-50 border border-beige-200 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-beige-200 flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-beige-600" />
            </div>
            <p className="font-medium text-navy-500">
              {lang === 'ar' ? `لا يوجد ${TABS.find(t => t.id === tab)?.label_ar} بعد` : `No ${tab}s yet`}
            </p>
            <p className="text-xs text-smoke-500">
              {lang === 'ar' ? 'اضغط توليد فوق' : 'Tap Generate above'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visiblePkgs.map((pkg, i) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                index={i}
                lang={lang}
                dir={dir}
                rendering={rendering === pkg.id}
                onDownload={() => {
                  if (tab === 'story')      handleDownloadStory(pkg)
                  else if (tab === 'post')  handleDownloadPost(pkg, i)
                  else                      handleDownloadDump(pkg)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Package card ──
function PackageCard({ pkg, index, lang, dir, rendering, onDownload }: {
  pkg: Package; index: number; lang: string; dir: string;
  rendering: boolean; onDownload: () => void;
}) {
  const caption = lang === 'ar' ? pkg.caption_ar : pkg.caption_en

  return (
    <div className="bg-beige-50 border border-beige-200 rounded-2xl overflow-hidden" dir={dir}>
      {/* Photo preview strip */}
      {pkg.photos && pkg.photos.length > 0 && (
        <div className="flex gap-1 p-2 bg-beige-100">
          {pkg.photos.slice(0, 4).map((photo, i) => (
            <div key={photo.id} className="flex-1 aspect-square rounded-lg overflow-hidden bg-beige-200">
              <img
                src={getPublicUrl(photo)}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          ))}
          {pkg.photos.length < 4 && Array.from({ length: 4 - pkg.photos.length }).map((_, i) => (
            <div key={i} className="flex-1 aspect-square rounded-lg bg-beige-200" />
          ))}
        </div>
      )}

      <div className="p-4">
        {/* Caption */}
        <p className={`text-sm text-navy-500 leading-relaxed mb-3 ${lang === 'ar' ? 'text-right font-arabic' : ''}`}
          style={{ fontFamily: lang === 'ar' ? "'Amiri', serif" : undefined }}>
          {caption}
        </p>

        {/* Hashtags */}
        {pkg.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pkg.hashtags.map((tag, i) => (
              <span key={i} className="text-[11px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Download button */}
        <button onClick={onDownload} disabled={rendering}
          className="w-full h-10 bg-brand-500 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {rendering
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{lang === 'ar' ? 'جاري التحضير...' : 'Preparing...'}</>
            : <><Download className="w-3.5 h-3.5" />{lang === 'ar' ? 'تحميل PNG' : 'Download PNG'}</>}
        </button>
      </div>
    </div>
  )
}

// Get usable URL for a photo (prefer compressed)
function getPublicUrl(photo: MediaItem): string {
  const supabase = createClient()
  const path = photo.url_compressed ?? photo.url_original
  const bucket = photo.url_compressed ? 'media-compressed' : 'media-originals'
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

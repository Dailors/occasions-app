'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { VIDEO_TEMPLATES, type VideoTemplate, type TemplateStyle } from '@/lib/video-templates'
import {
  Wand2, Clapperboard, Loader2, Download, CheckCircle2, XCircle, RefreshCw, Sparkles, Heart, Music, Users, Film,
} from 'lucide-react'

type FilterStyle = 'all' | TemplateStyle

const STYLE_TABS: { id: FilterStyle; label_en: string; label_ar: string; emoji: string }[] = [
  { id: 'all',       label_en: 'All',       label_ar: 'الكل',         emoji: '✨' },
  { id: 'romantic',  label_en: 'Romantic',  label_ar: 'رومانسي',     emoji: '💕' },
  { id: 'hype',      label_en: 'Hype',      label_ar: 'حماس',        emoji: '🔥' },
  { id: 'cinematic', label_en: 'Cinematic', label_ar: 'سينمائي',     emoji: '🎬' },
  { id: 'family',    label_en: 'Family',    label_ar: 'عائلي',       emoji: '👨‍👩‍👧' },
  { id: 'aesthetic', label_en: 'Aesthetic', label_ar: 'جمالي',       emoji: '🌸' },
]

interface VideoJob {
  id: string
  template_id: string
  status: string
  created_at: string
  timeline?: any
  url?: string
}

export default function VideosPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [jobs, setJobs]             = useState<VideoJob[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<FilterStyle>('all')
  const [generating, setGenerating] = useState<string | null>(null)
  const [error, setError]           = useState('')
  const [photoCount, setPhotoCount] = useState(0)

  useEffect(() => { load() }, [eventId])

  const load = async () => {
    const { count } = await supabase
      .from('media').select('id', { count: 'exact', head: true })
      .eq('event_id', eventId).eq('type', 'photo')
    setPhotoCount(count ?? 0)

    const { data } = await supabase
      .from('video_jobs').select('*').eq('event_id', eventId)
      .order('created_at', { ascending: false })

    // Hydrate with video URLs
    const hydrated = await Promise.all((data ?? []).map(async (job: any) => {
      const { data: gen } = await supabase
        .from('generated_videos').select('url').eq('job_id', job.id).maybeSingle()
      return { ...job, url: gen?.url }
    }))
    setJobs(hydrated)
    setLoading(false)

    // Poll any processing jobs
    const processing = hydrated.filter(j => j.status === 'processing' || j.status === 'pending')
    for (const job of processing) pollJob(job.id)
  }

  const pollJob = async (jobId: string) => {
    let tries = 0
    const max = 60  // ~5 min @ 5s intervals
    while (tries < max) {
      await new Promise(r => setTimeout(r, 5000))
      try {
        const res = await fetch(`/api/video/status/${jobId}`)
        const data = await res.json()
        if (data.status === 'done' || data.status === 'failed') {
          await load()
          return
        }
      } catch {}
      tries++
    }
  }

  const generate = async (template: VideoTemplate) => {
    setGenerating(template.id)
    setError('')
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, template_id: template.id }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setGenerating(null); return }

      await load()
      if (data.job_id) pollJob(data.job_id)
    } catch (err: any) {
      setError(err.message ?? 'Failed')
    }
    setGenerating(null)
  }

  const download = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objUrl
      link.download = filename
      document.body.appendChild(link); link.click(); link.remove()
      URL.revokeObjectURL(objUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const visibleTemplates = filter === 'all' ? VIDEO_TEMPLATES : VIDEO_TEMPLATES.filter(t => t.style === filter)
  const processingJobs = jobs.filter(j => j.status === 'processing' || j.status === 'pending')
  const completedJobs = jobs.filter(j => j.status === 'done' && j.url)

  return (
    <div dir={dir}>
      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <Clapperboard className="w-5 h-5 text-beige-400" />
          <h1 className="font-serif text-2xl text-white">{lang === 'ar' ? 'فيديو سينمائي' : 'Cinematic Videos'}</h1>
        </div>
        <p className="text-sm text-brand-100">
          {lang === 'ar' ? `${photoCount} صورة جاهزة · اختر قالب` : `${photoCount} photos ready · pick a template`}
        </p>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Style filter tabs */}
        <div className="flex gap-2 overflow-x-auto scroll-hide -mx-5 px-5">
          {STYLE_TABS.map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium !min-h-0 flex items-center gap-1 ${
                filter === tab.id ? 'bg-navy-500 text-white' : 'bg-beige-50 border border-beige-200 text-navy-500'
              }`}>
              <span>{tab.emoji}</span>{lang === 'ar' ? tab.label_ar : tab.label_en}
            </button>
          ))}
        </div>

        {/* Processing jobs */}
        {processingJobs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              <h3 className="font-semibold text-amber-900 text-sm">
                {lang === 'ar' ? `${processingJobs.length} فيديو قيد التجهيز...` : `${processingJobs.length} video(s) rendering...`}
              </h3>
            </div>
            <p className="text-xs text-amber-700">
              {lang === 'ar' ? 'سيظهر تلقائياً عند الانتهاء (30-60 ثانية)' : "Will appear automatically when ready (~30-60s)"}
            </p>
          </div>
        )}

        {/* Completed videos */}
        {completedJobs.length > 0 && (
          <div>
            <h2 className="font-semibold text-navy-500 mb-3 text-sm">{lang === 'ar' ? 'فيديوهات جاهزة' : 'Ready to download'}</h2>
            <div className="flex flex-col gap-3">
              {completedJobs.map(job => {
                const tpl = VIDEO_TEMPLATES.find(t => t.id === job.template_id)
                return (
                  <div key={job.id} className="bg-beige-50 border border-beige-200 rounded-2xl overflow-hidden">
                    <video src={job.url} controls className="w-full aspect-[9/16] bg-black object-contain" />
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-navy-500">{tpl?.emoji} {tpl?.name_en}</p>
                        <p className="text-[10px] text-smoke-500">{tpl?.duration}s</p>
                      </div>
                      <button onClick={() => download(job.url!, `${tpl?.name_en || 'video'}.mp4`)}
                        className="h-9 px-3 bg-brand-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'تحميل' : 'Download'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Template grid */}
        <div>
          <h2 className="font-semibold text-navy-500 mb-3 text-sm">
            {lang === 'ar' ? `${visibleTemplates.length} قالب متاح` : `${visibleTemplates.length} templates available`}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {visibleTemplates.map(tpl => {
              const hasEnoughPhotos = photoCount >= tpl.photo_count
              const isGen = generating === tpl.id
              return (
                <button key={tpl.id} onClick={() => generate(tpl)}
                  disabled={!hasEnoughPhotos || !!generating}
                  className="bg-beige-50 border border-beige-200 rounded-2xl p-3 text-start disabled:opacity-50 relative overflow-hidden">
                  {/* Color stripe */}
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: tpl.preview_color }} />
                  <div className="text-3xl mb-1">{tpl.emoji}</div>
                  <h3 className="font-semibold text-navy-500 text-sm leading-tight mb-0.5">
                    {lang === 'ar' ? tpl.name_ar : tpl.name_en}
                  </h3>
                  <p className="text-[10px] text-smoke-500 mb-2 leading-tight">
                    {lang === 'ar' ? tpl.description_ar : tpl.description_en}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-smoke-700">
                    <span>{tpl.duration}s</span>
                    <span>·</span>
                    <span>{tpl.photo_count} 📷</span>
                  </div>
                  {!hasEnoughPhotos && (
                    <p className="text-[10px] text-red-600 mt-1 font-medium">
                      {lang === 'ar' ? `يحتاج ${tpl.photo_count} صور` : `Need ${tpl.photo_count} photos`}
                    </p>
                  )}
                  {isGen && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {!loading && photoCount === 0 && (
          <div className="bg-beige-50 border border-beige-200 rounded-2xl p-8 text-center">
            <Sparkles className="w-8 h-8 text-beige-600 mx-auto mb-2" />
            <p className="font-medium text-navy-500">{lang === 'ar' ? 'ارفع الصور أولاً' : 'Upload photos first'}</p>
            <p className="text-sm text-smoke-500 mt-1">
              {lang === 'ar' ? 'تحتاج صور لإنشاء فيديو' : 'You need photos to generate a video.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { ArrowLeft, Clapperboard, Heart, Music, Users, Wand2, Download, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface VideoJob {
  id:            string
  style:         string
  duration:      number
  music_mood:    string
  status:        string
  created_at:    string
  error_message: string | null
}

const STYLES = [
  { id: 'romantic', icon: Heart,  color: 'bg-pink-500',    tkey: 'video.style_romantic'  },
  { id: 'party',    icon: Music,  color: 'bg-purple-500',  tkey: 'video.style_party'     },
  { id: 'family',   icon: Users,  color: 'bg-amber-500',   tkey: 'video.style_family'    },
] as const

const MOODS_EN = ['Emotional', 'Upbeat', 'Cinematic', 'Gentle', 'Energetic']
const MOODS_AR = ['عاطفي', 'مبهج', 'سينمائي', 'هادئ', 'حماسي']

export default function VideosPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [jobs, setJobs]     = useState<VideoJob[]>([])
  const [loading, setLoading] = useState(true)
  const [style, setStyle]   = useState<'romantic' | 'party' | 'family'>('romantic')
  const [duration, setDuration] = useState(40)
  const [mood, setMood]     = useState(lang === 'ar' ? 'عاطفي' : 'Emotional')
  const [generating, setGenerating] = useState(false)

  const moods = lang === 'ar' ? MOODS_AR : MOODS_EN

  useEffect(() => { load() }, [eventId])

  const load = async () => {
    const { data } = await supabase
      .from('video_jobs').select('*').eq('event_id', eventId)
      .order('created_at', { ascending: false })
    setJobs(data ?? [])
    setLoading(false)
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, style, duration, music_mood: mood }),
      })
      const data = await res.json()
      if (data.error) alert(data.error)
      await load()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="app-container min-h-screen" dir={dir}>
      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center safe-area-inset-top">
        <Link href={`/dashboard/${eventId}`} className="flex items-center gap-2 text-white !min-h-0">
          <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium">{t('common.back')}</span>
        </Link>
      </div>

      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <Clapperboard className="w-5 h-5 text-beige-400" />
          <h1 className="font-serif text-2xl text-white">{t('video.generate_title')}</h1>
        </div>
        <p className="text-sm text-brand-100">{t('video.generate_hint')}</p>
      </div>

      <div className="px-5 py-5 -mt-5 flex flex-col gap-4">
        {/* Style picker */}
        <div className="card-warm rounded-2xl p-5">
          <h3 className="font-semibold text-navy-500 mb-3">{t('video.style')}</h3>
          <div className="flex flex-col gap-2">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-start transition-all ${
                  style === s.id ? 'border-brand-500 bg-brand-50' : 'border-smoke-100 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-navy-500 flex-1">{t(s.tkey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="card-warm rounded-2xl p-5">
          <label className="font-semibold text-navy-500 mb-3 block">{t('video.duration')}: {duration}s</label>
          <input
            type="range" min={20} max={90} step={10}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>

        {/* Mood */}
        <div className="card-warm rounded-2xl p-5">
          <h3 className="font-semibold text-navy-500 mb-3">{t('video.music_mood')}</h3>
          <div className="flex flex-wrap gap-2">
            {moods.map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`px-3 py-2 rounded-full text-sm font-medium border transition-all !min-h-0 ${
                  mood === m ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-navy-500 border-smoke-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center justify-center gap-2 w-full h-12 bg-navy-500 text-white font-medium rounded-2xl shadow-lg shadow-navy-500/20 disabled:opacity-50"
        >
          <Wand2 className="w-4 h-4" />
          {generating ? t('video.rendering') : t('video.generate_btn')}
        </button>

        {/* Job list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? null : (
          <div className="flex flex-col gap-3">
            {jobs.map(job => <JobCard key={job.id} job={job} t={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, t }: { job: VideoJob; t: any }) {
  const StatusIcon = {
    pending: Clock, processing: Loader2, done: CheckCircle2, failed: XCircle,
  }[job.status] ?? Clock

  return (
    <div className="card-warm rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-navy-500 capitalize">{job.style}</p>
          <p className="text-xs text-smoke-500">{job.duration}s · {job.music_mood}</p>
        </div>
        <StatusIcon className={`w-5 h-5 ${
          job.status === 'processing' ? 'text-brand-500 animate-spin' :
          job.status === 'done' ? 'text-green-500' :
          job.status === 'failed' ? 'text-red-500' : 'text-smoke-500'
        }`} />
      </div>
      {job.status === 'done' && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button className="flex items-center justify-center gap-1 h-9 bg-brand-50 text-brand-600 text-xs font-medium rounded-lg">
            <Download className="w-3 h-3" />Highlight
          </button>
          <button className="flex items-center justify-center gap-1 h-9 bg-brand-50 text-brand-600 text-xs font-medium rounded-lg">
            <Download className="w-3 h-3" />Reel
          </button>
          <button className="flex items-center justify-center gap-1 h-9 bg-brand-50 text-brand-600 text-xs font-medium rounded-lg">
            <Download className="w-3 h-3" />Status
          </button>
        </div>
      )}
    </div>
  )
}

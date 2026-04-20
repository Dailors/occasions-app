'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Sparkles, Copy, Check, Download, RefreshCw, Wand2 } from 'lucide-react'

interface StoryPackage {
  id:         string
  format:     'story' | 'post' | 'photo_dump'
  variant:    number
  media_ids:  string[]
  caption_en: string
  caption_ar: string
  hashtags:   string[]
  status:     string
}

interface MediaItem {
  id:             string
  preview_url?:   string
  url_compressed?: string
  url_original:   string
}

export default function StoriesPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const supabase = createClient()

  const [packages, setPackages] = useState<StoryPackage[]>([])
  const [media, setMedia]       = useState<Record<string, MediaItem>>({})
  const [loading, setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)

  useEffect(() => { load() }, [eventId])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/events/${eventId}/stories`)
    const data = await res.json()
    setPackages(data.packages ?? [])

    // Load media previews
    const allIds = (data.packages ?? []).flatMap((p: StoryPackage) => p.media_ids)
    if (allIds.length > 0) {
      const { data: mediaList } = await supabase
        .from('media').select('id, url_original, url_compressed')
        .in('id', allIds)

      const map: Record<string, MediaItem> = {}
      for (const m of mediaList ?? []) {
        const path = m.url_compressed ?? m.url_original
        const { data: signed } = await supabase.storage
          .from(m.url_compressed ? 'media-compressed' : 'media-originals')
          .createSignedUrl(path, 60 * 60)
        map[m.id] = { ...m, preview_url: signed?.signedUrl }
      }
      setMedia(map)
    }
    setLoading(false)
  }

  const generate = async () => {
    setGenerating(true)
    const res = await fetch(`/api/events/${eventId}/stories`, { method: 'POST' })
    const data = await res.json()
    if (data.error) alert(data.error)
    await load()
    setGenerating(false)
  }

  const copyCaption = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadAll = async (pkg: StoryPackage) => {
    for (const mid of pkg.media_ids) {
      const m = media[mid]
      if (m?.preview_url) {
        const link = document.createElement('a')
        link.href = m.preview_url
        link.download = `${pkg.format}-${mid}.jpg`
        link.target = '_blank'
        link.click()
        await new Promise(r => setTimeout(r, 400))
      }
    }
  }

  const formatLabel: Record<string, string> = {
    story:      '📱 Story',
    post:       '📷 Post',
    photo_dump: '🎞️ Photo Dump',
  }

  return (
    <div className="app-container min-h-screen">
      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center safe-area-inset-top">
        <Link href={`/dashboard/${eventId}`} className="flex items-center gap-2 text-white !min-h-0">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-beige-400" />
          <h1 className="font-serif text-2xl text-white">AI Stories</h1>
        </div>
        <p className="text-sm text-brand-100">
          Let AI pick your best photos and write captions, ready to post.
        </p>
      </div>

      <div className="px-5 py-5 -mt-5">
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center justify-center gap-2 w-full h-12 bg-navy-500 text-white font-medium rounded-2xl hover:bg-navy-600 transition-colors mb-5 shadow-lg shadow-navy-500/20 disabled:opacity-50"
        >
          {generating ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
          ) : packages.length > 0 ? (
            <><RefreshCw className="w-4 h-4" /> Regenerate</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate 6 AI packages</>
          )}
        </button>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="card-warm rounded-2xl p-8 text-center">
            <Wand2 className="w-10 h-10 text-beige-600 mx-auto mb-3" />
            <p className="font-medium text-navy-500 mb-1">No AI stories yet</p>
            <p className="text-sm text-smoke-500">
              Upload at least 6 photos, then click "Generate" above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="card-warm rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-600">
                    {formatLabel[pkg.format]} #{pkg.variant}
                  </span>
                  <span className="text-xs text-smoke-500">
                    {pkg.media_ids.length} photo{pkg.media_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Photos */}
                <div className={`grid gap-1.5 mb-3 ${
                  pkg.media_ids.length === 1
                    ? 'grid-cols-1'
                    : pkg.media_ids.length <= 4
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                }`}>
                  {pkg.media_ids.slice(0, 6).map(mid => {
                    const m = media[mid]
                    return (
                      <div key={mid} className="aspect-square rounded-lg overflow-hidden bg-beige-200">
                        {m?.preview_url && (
                          <img src={m.preview_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Captions */}
                {pkg.caption_en && (
                  <div className="mb-2 p-3 rounded-xl bg-beige-50 border border-beige-200">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase font-semibold text-smoke-500">English</span>
                      <button
                        onClick={() => copyCaption(pkg.id + '-en', pkg.caption_en + '\n\n' + (pkg.hashtags ?? []).map(h => `#${h}`).join(' '))}
                        className="text-brand-500 !min-h-0 p-0"
                      >
                        {copied === pkg.id + '-en'
                          ? <Check className="w-3.5 h-3.5" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                    <p className="text-sm text-navy-500">{pkg.caption_en}</p>
                  </div>
                )}

                {pkg.caption_ar && (
                  <div className="mb-2 p-3 rounded-xl bg-beige-50 border border-beige-200">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase font-semibold text-smoke-500">العربية</span>
                      <button
                        onClick={() => copyCaption(pkg.id + '-ar', pkg.caption_ar)}
                        className="text-brand-500 !min-h-0 p-0"
                      >
                        {copied === pkg.id + '-ar'
                          ? <Check className="w-3.5 h-3.5" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                    <p className="text-sm text-navy-500" dir="rtl">{pkg.caption_ar}</p>
                  </div>
                )}

                {(pkg.hashtags ?? []).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {pkg.hashtags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => downloadAll(pkg)}
                  className="w-full h-10 flex items-center justify-center gap-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600"
                >
                  <Download className="w-4 h-4" />
                  Download photos
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

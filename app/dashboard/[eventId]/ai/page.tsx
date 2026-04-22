'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { Wand2, Copy, Check, Download, RefreshCw, Clapperboard, ImagePlus, Layers } from 'lucide-react'

type Kind = 'story' | 'post' | 'photo_dump' | 'video'

const KINDS: { id: Kind; icon: any; label: string; desc: string; color: string }[] = [
  { id: 'story',      icon: ImagePlus,    label: 'Story',       desc: 'Instagram story (9:16)',         color: 'bg-pink-500'   },
  { id: 'post',       icon: Wand2,        label: 'Post',        desc: 'Square post with caption',        color: 'bg-purple-500' },
  { id: 'photo_dump', icon: Layers,       label: 'Photo Dump',  desc: 'Carousel of 6-8 photos',          color: 'bg-amber-500'  },
  { id: 'video',      icon: Clapperboard, label: 'Video',       desc: 'Cinematic highlight',             color: 'bg-brand-500'  },
]

export default function AIPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<any[]>([])
  const [media, setMedia] = useState<Record<string, any>>({})
  const [generating, setGenerating] = useState<Kind | null>(null)
  const [copied, setCopied] = useState('')

  useEffect(() => { load() }, [eventId])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/events/${eventId}/stories`)
    const data = await res.json()
    setPackages(data.packages ?? [])

    const allIds = (data.packages ?? []).flatMap((p: any) => p.media_ids ?? [])
    if (allIds.length > 0) {
      const { data: list } = await supabase.from('media').select('id, url_original, url_compressed').in('id', allIds)
      const map: Record<string, any> = {}
      for (const m of list ?? []) {
        const bucket = m.url_compressed ? 'media-compressed' : 'media-originals'
        const path = m.url_compressed ?? m.url_original
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
        map[m.id] = { ...m, preview_url: signed?.signedUrl }
      }
      setMedia(map)
    }
    setLoading(false)
  }

  const generate = async (kind: Kind) => {
    setGenerating(kind)
    const res = await fetch(`/api/events/${eventId}/stories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, count: 2 }),
    })
    const data = await res.json()
    if (data.error) alert(data.error)
    await load()
    setGenerating(null)
  }

  const regenerationCount = (kind: Kind) => packages.filter(p => p.format === kind).length
  const canGenerate = (kind: Kind) => regenerationCount(kind) < 6  // 2 initial + 3 regens * 2 items

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  const byKind = KINDS.map(k => ({ ...k, items: packages.filter(p => p.format === k.id) }))

  return (
    <div dir={dir}>
      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-beige-400" />
          <h1 className="font-serif text-2xl text-white">AI Suggestions</h1>
        </div>
        <p className="text-sm text-brand-100">
          {lang === 'ar' ? 'دع الذكاء الاصطناعي يختار أفضل اللحظات ويصنع محتوى جاهز للنشر' : 'Let AI curate your best moments into ready-to-post content.'}
        </p>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          byKind.map(kind => (
            <div key={kind.id} className="bg-beige-50 border border-beige-200 rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kind.color}`}>
                    <kind.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-500">{kind.label}</h3>
                    <p className="text-xs text-smoke-500">{kind.desc}</p>
                  </div>
                </div>
                <div className="text-xs text-smoke-500">
                  {kind.items.length}/6
                </div>
              </div>

              {kind.items.length > 0 && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                  {kind.items.slice(0, 6).map(pkg => (
                    <PackageCard key={pkg.id} pkg={pkg} media={media} onCopy={copyText} copied={copied} />
                  ))}
                </div>
              )}

              <div className="px-4 pb-4">
                <button onClick={() => generate(kind.id)}
                  disabled={generating === kind.id || !canGenerate(kind.id)}
                  className="w-full h-11 bg-brand-500 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {generating === kind.id ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : kind.items.length === 0 ? (
                    <><Wand2 className="w-4 h-4" /> Generate 2 {kind.label.toLowerCase()}s</>
                  ) : canGenerate(kind.id) ? (
                    <><RefreshCw className="w-4 h-4" /> Regenerate 2 more</>
                  ) : (
                    <>Max reached ({regenerationCount(kind.id)}/6)</>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PackageCard({ pkg, media, onCopy, copied }: any) {
  return (
    <div className="bg-white rounded-xl p-3 border border-beige-200">
      <div className={`grid gap-1 mb-2 ${
        pkg.media_ids?.length === 1 ? 'grid-cols-1' :
        pkg.media_ids?.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
      }`}>
        {(pkg.media_ids ?? []).slice(0, 6).map((mid: string) => {
          const m = media[mid]
          return (
            <div key={mid} className="aspect-square rounded bg-beige-200 overflow-hidden">
              {m?.preview_url && <img src={m.preview_url} alt="" className="w-full h-full object-cover" />}
            </div>
          )
        })}
      </div>
      {pkg.caption_en && (
        <div className="text-xs text-navy-500 mb-1">
          {pkg.caption_en}
          <button onClick={() => onCopy(pkg.id, pkg.caption_en + ' ' + (pkg.hashtags ?? []).map((h: string) => '#' + h).join(' '))} className="ml-2 text-brand-500 !min-h-0 p-0 align-middle">
            {copied === pkg.id ? <Check className="w-3 h-3 inline" /> : <Copy className="w-3 h-3 inline" />}
          </button>
        </div>
      )}
      {pkg.caption_ar && <p className="text-xs text-navy-500" dir="rtl">{pkg.caption_ar}</p>}
    </div>
  )
}

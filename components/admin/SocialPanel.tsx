// components/admin/SocialPanel.tsx
// Generates AI captions, hashtags, and story overlays.
// Admin can copy each one with one tap.

'use client'
import { useState } from 'react'
import { Sparkles, Copy, Check, RefreshCw, Hash, MessageSquare, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import type { SocialContent } from '@/types'
import toast from 'react-hot-toast'

interface SocialPanelProps {
  eventId: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-500" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </button>
  )
}

export function SocialPanel({ eventId }: SocialPanelProps) {
  const [content, setContent] = useState<SocialContent | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/events/${eventId}/social`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setContent(data)
    } catch (err: any) {
      toast.error(err.message ?? 'Could not generate content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <h2 className="font-medium text-gray-900">Social content</h2>
            <p className="text-xs text-gray-500">AI-generated captions and story text</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={generate}
          className="gap-1.5"
        >
          {content
            ? <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
            : <><Sparkles className="w-3.5 h-3.5" /> Generate</>
          }
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      )}

      {!loading && content && (
        <div className="flex flex-col gap-4">
          {/* Caption */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <MessageSquare className="w-3.5 h-3.5" />
                Caption
              </span>
              <CopyButton text={content.caption} />
            </div>
            <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">
              {content.caption}
            </p>
          </div>

          {/* Story overlay */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Layers className="w-3.5 h-3.5" />
                Story overlay
              </span>
              <CopyButton text={content.story_overlay} />
            </div>
            <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2.5 font-medium">
              {content.story_overlay}
            </p>
          </div>

          {/* Hashtags */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Hash className="w-3.5 h-3.5" />
                Hashtags
              </span>
              <CopyButton text={content.hashtags.map(h => `#${h}`).join(' ')} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {content.hashtags.map(tag => (
                <span
                  key={tag}
                  className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !content && (
        <div className="text-center py-6 text-gray-400">
          <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Click generate to create social content for this wedding.</p>
        </div>
      )}
    </Card>
  )
}

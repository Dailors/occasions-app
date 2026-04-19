// components/admin/TemplateSelector.tsx
'use client'
import { useState } from 'react'
import { Play, Clock, Music } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { TEMPLATE_LIST } from '@/lib/templates'
import toast from 'react-hot-toast'

interface TemplateSelectorProps {
  eventId: string
  onJobCreated?: (jobId: string, templateId: string) => void
}

export function TemplateSelector({ eventId, onJobCreated }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const handleGenerate = async () => {
    if (!selected) { toast.error('Select a template first'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/video/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ event_id: eventId, template_id: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Video generation started!')
      onJobCreated?.(data.job_id, selected)
    } catch (err: any) {
      toast.error(err.message ?? 'Could not start generation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TEMPLATE_LIST.map(t => (
          <button
            key={t.template_id}
            onClick={() => setSelected(t.template_id)}
            className={cn(
              'flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all',
              selected === t.template_id
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            )}
          >
            <span className="text-base font-medium text-gray-900">{t.name}</span>
            <span className="text-xs text-gray-500">{t.description}</span>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t.duration}s
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                {t.music_style.replace(/_/g, ' ')}
              </span>
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {t.segments.length} segments
              </span>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleGenerate}
        loading={loading}
        disabled={!selected}
        size="lg"
        className="self-start gap-2"
      >
        <Play className="w-4 h-4" />
        Generate wedding video
      </Button>
    </div>
  )
}

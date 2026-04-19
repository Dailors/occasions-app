// components/admin/DownloadAll.tsx
// Fetches signed URLs then downloads all media sequentially with a progress indicator.

'use client'
import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface DownloadAllProps {
  eventId: string
  total:   number
}

export function DownloadAll({ eventId, total }: DownloadAllProps) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const handleDownload = async () => {
    if (total === 0) { toast.error('No media to download'); return }

    try {
      // 1. Get signed URLs from API
      const res  = await fetch(`/api/events/${eventId}/download`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const files: { name: string; url: string }[] = data.files
      setProgress({ done: 0, total: files.length })

      // 2. Download each file sequentially using <a> click trick
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const a = document.createElement('a')
        a.href     = f.url
        a.download = f.name
        a.target   = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Small delay to avoid browser throttling bulk downloads
        await new Promise(r => setTimeout(r, 300))
        setProgress({ done: i + 1, total: files.length })
      }

      toast.success(`Downloaded ${files.length} files`)
    } catch (err: any) {
      toast.error(err.message ?? 'Download failed')
    } finally {
      setTimeout(() => setProgress(null), 2000)
    }
  }

  if (progress) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
        <Loader2 className="w-4 h-4 text-brand-500 animate-spin flex-shrink-0" />
        <div className="flex-1">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {progress.done}/{progress.total}
        </span>
      </div>
    )
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={total === 0}
      className="gap-1.5"
    >
      <Download className="w-3.5 h-3.5" />
      Download all ({total})
    </Button>
  )
}

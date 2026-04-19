// components/admin/RetagButton.tsx
// Triggers bulk AI re-tagging for all untagged photos in the event.

'use client'
import { useState } from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface RetagButtonProps {
  eventId: string
}

export function RetagButton({ eventId }: RetagButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const handleRetag = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/events/${eventId}/retag`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.tagged === 0) {
        toast.success('All photos are already tagged')
      } else {
        toast.success(`Tagged ${data.tagged} photo${data.tagged !== 1 ? 's' : ''}`)
        setDone(true)
        setTimeout(() => setDone(false), 4000)
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Re-tag failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      onClick={handleRetag}
      className="gap-1.5"
    >
      {done
        ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Tagged</>
        : <><Sparkles className="w-3.5 h-3.5" /> Re-tag all</>
      }
    </Button>
  )
}

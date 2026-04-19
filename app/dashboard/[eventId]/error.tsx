// app/dashboard/[eventId]/error.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function EventError({ error, reset }: Props) {
  useEffect(() => { console.error('[EventError]', error) }, [error])
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <p className="font-medium text-gray-900">Failed to load this page</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">{error.message}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
          All events
        </Button>
        <Button size="sm" onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}

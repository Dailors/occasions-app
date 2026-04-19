// app/dashboard/[eventId]/settings/error.tsx
'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function SettingsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[SettingsError]', error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <p className="font-medium text-gray-900">Failed to load settings</p>
        <p className="text-sm text-gray-500 mt-1">{error.message}</p>
      </div>
      <Button size="sm" onClick={reset}>Try again</Button>
    </div>
  )
}

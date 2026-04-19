// app/error.tsx
// Catches unhandled errors at the route level.

'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
  error:  Error & { digest?: string }
  reset:  () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[Route Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div>
        <h1 className="font-serif text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">
          {error.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => window.history.back()}>Go back</Button>
        <Button size="sm" onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}

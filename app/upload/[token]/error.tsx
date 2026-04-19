// app/upload/[token]/error.tsx
'use client'
import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

export default function UploadError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[UploadError]', error) }, [error])
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-red-400" />
      </div>
      <h1 className="font-serif text-xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="text-sm text-gray-500 max-w-xs">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

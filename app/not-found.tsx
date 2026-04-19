// app/not-found.tsx
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-brand-400" />
      </div>
      <div>
        <h1 className="font-serif text-4xl font-semibold text-gray-900">404</h1>
        <p className="text-gray-500 mt-2">This page doesn't exist.</p>
      </div>
      <Link
        href="/"
        className="text-sm text-brand-600 hover:text-brand-700 font-medium underline underline-offset-4"
      >
        Go home
      </Link>
    </div>
  )
}

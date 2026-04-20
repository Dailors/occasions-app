'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params?.get('redirect') ?? '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push(redirectTo)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
  }

  return (
    <div className="app-container flex flex-col">
      {/* Top brand area */}
      <div className="bg-brand-500 px-6 pt-12 pb-16 rounded-b-[32px] safe-area-inset-top">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl text-white">Occasions</span>
        </div>
        <h1 className="font-serif text-3xl text-white mb-2">Welcome back</h1>
        <p className="text-brand-100 text-sm">Sign in to manage your events</p>
      </div>

      <div className="px-6 py-8 flex-1 flex flex-col">
        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full h-12 border border-smoke-100 rounded-xl bg-white text-navy-500 font-medium hover:border-smoke-300 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-smoke-100" />
          <span className="text-xs text-smoke-500">or</span>
          <div className="flex-1 h-px bg-smoke-100" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-smoke-700 mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-smoke-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-smoke-700 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl border border-smoke-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-smoke-500 hover:text-navy-500 !min-h-0 p-1"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full h-12 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-auto pt-8 text-center">
          <p className="text-sm text-smoke-500">
            New here?{' '}
            <Link href="/auth/signup" className="text-brand-500 font-medium">
              Create an account
            </Link>
          </p>
          <p className="text-xs text-smoke-500 mt-4">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

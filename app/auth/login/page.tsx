// app/auth/login/page.tsx
'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()
  const redirect     = searchParams.get('redirect') ?? '/dashboard'

  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      })
      if (error) throw error
      router.push(redirect)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const errorParam = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Occasions</h1>
          <p className="text-sm text-gray-500">Sign in to your admin account</p>
        </div>

        {/* Error banner */}
        {errorParam && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {errorParam === 'not_admin'
              ? 'This account does not have admin access.'
              : decodeURIComponent(errorParam)}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              error={errors.email}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              error={errors.password}
            />
            <Button type="submit" loading={loading} size="lg" className="mt-1">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          No account?{' '}
          <Link href="/auth/signup" className="text-brand-600 hover:text-brand-700 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

// app/auth/signup/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading]   = useState(false)
  const [sent,    setSent]      = useState(false)
  const [form,    setForm]      = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [errors,  setErrors]    = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim())        e.full_name = 'Name is required'
    if (!form.email)                   e.email     = 'Email is required'
    if (form.password.length < 8)      e.password  = 'Password must be at least 8 characters'
    if (form.password !== form.confirm) e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          data:         { full_name: form.full_name, role: 'admin' },
          emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard`,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      toast.error(err.message ?? 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to <strong>{form.email}</strong>.<br />
            Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500">Admin accounts only</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="full_name"
              label="Full name"
              placeholder="Sara Al Rashid"
              autoComplete="name"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              error={errors.full_name}
            />
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
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              error={errors.password}
            />
            <Input
              id="confirm"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              error={errors.confirm}
            />
            <Button type="submit" loading={loading} size="lg" className="mt-1">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

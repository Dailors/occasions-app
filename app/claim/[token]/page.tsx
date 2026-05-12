'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import {
  Sparkles, Loader2, CheckCircle2, XCircle, Mail, Lock, Eye, EyeOff, User, ArrowRight,
} from 'lucide-react'

interface EventPreview {
  id: string
  couple_names: string
  wedding_date: string | null
  claimed_at: string | null
  admin_id: string | null
}

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>()
  const { t, dir, lang } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<EventPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Auth form state
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [claiming, setClaiming] = useState(false)
  const [success, setSuccess] = useState(false)

  // Load event preview + check current user
  useEffect(() => {
    const load = async () => {
      // Public read of event by token (RLS allows this for unclaimed events)
      const { data: ev, error: evErr } = await supabase
        .from('events')
        .select('id, couple_names, wedding_date, claimed_at, admin_id')
        .eq('claim_token', token)
        .maybeSingle()

      if (evErr || !ev) {
        setError(lang === 'ar' ? 'رابط غير صالح' : 'Invalid link')
        setLoading(false)
        return
      }

      if (ev.claimed_at) {
        setError(lang === 'ar' ? 'تم استلام هذه المناسبة مسبقاً' : 'This event has already been claimed')
        setLoading(false)
        return
      }

      setEvent(ev)

      // Check if user is already logged in
      const { data: { user: existingUser } } = await supabase.auth.getUser()
      if (existingUser) {
        setUser(existingUser)
      }

      setLoading(false)
    }
    load()
  }, [token])

  // Auto-claim if user becomes available
  useEffect(() => {
    if (user && event && !event.claimed_at && !claiming && !success) {
      claimEvent()
    }
  }, [user, event])

  const claimEvent = async () => {
    if (!user || !event) return
    setClaiming(true)
    setError('')

    try {
      // Ensure the profile has role='host'
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? fullName ?? user.email?.split('@')[0],
          role: 'host',
        }, { onConflict: 'id' })

      if (profileErr) {
        console.error('Profile upsert failed:', profileErr)
      }

      // Call the claim function (defined in DB)
      const { data, error: claimErr } = await supabase.rpc('claim_event', {
        token_input: token,
      })

      if (claimErr) {
        setError(claimErr.message)
        setClaiming(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/${event.id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message ?? 'Failed to claim event')
      setClaiming(false)
    }
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setError(lang === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name')
          setSubmitting(false)
          return
        }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName, role: 'host' },
          },
        })
        if (signUpErr) { setError(signUpErr.message); setSubmitting(false); return }

        // If email confirmation is disabled (or session immediately granted)
        if (data.user && data.session) {
          setUser(data.user)
        } else if (data.user && !data.session) {
          // Email confirmation required — auto sign-in
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email, password,
          })
          if (signInErr) {
            setError(lang === 'ar' ? 'تم إنشاء الحساب. يرجى تأكيد البريد ثم العودة لاستلام المناسبة.' : 'Account created. Please verify your email then return to claim the event.')
            setSubmitting(false)
            return
          }
          setUser(signInData.user)
        }
      } else {
        // Login
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email, password,
        })
        if (signInErr) { setError(signInErr.message); setSubmitting(false); return }
        if (data.user) setUser(data.user)
      }
    } catch (err: any) {
      setError(err.message ?? 'Authentication failed')
    }
    setSubmitting(false)
  }

  const handleGoogleAuth = async () => {
    setSubmitting(true)
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/claim/${token}`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (oauthErr) {
      setError(oauthErr.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center" dir={dir}>
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="app-container flex flex-col items-center justify-center p-8 gap-4 text-center" dir={dir}>
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="font-serif text-2xl text-navy-500">{error}</h2>
        <Link href="/auth/login" className="text-brand-500 text-sm font-medium">
          {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
        </Link>
      </div>
    )
  }

  // Success screen
  if (success) {
    return (
      <div className="app-container flex flex-col items-center justify-center p-8 gap-4 text-center" dir={dir}>
        <div className="w-20 h-20 rounded-2xl bg-sage-100 flex items-center justify-center animate-fade-in">
          <CheckCircle2 className="w-10 h-10 text-sage-500" />
        </div>
        <h2 className="font-serif text-2xl text-navy-500">
          {lang === 'ar' ? 'تم استلام المناسبة!' : 'Event claimed!'}
        </h2>
        <p className="text-sm text-smoke-700 max-w-xs">
          {lang === 'ar' ? `${event?.couple_names} الآن لك. جاري التحويل...` : `${event?.couple_names} is now yours. Redirecting...`}
        </p>
        <Loader2 className="w-5 h-5 text-brand-500 animate-spin mt-2" />
      </div>
    )
  }

  // User is logged in but claim in progress
  if (user && claiming) {
    return (
      <div className="app-container flex flex-col items-center justify-center p-8 gap-4 text-center" dir={dir}>
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        <p className="text-sm text-smoke-700">
          {lang === 'ar' ? 'جاري استلام المناسبة...' : 'Claiming your event...'}
        </p>
      </div>
    )
  }

  // Auth screen
  return (
    <div className="app-container min-h-screen flex flex-col bg-cream-50" dir={dir}>
      {/* Header with brand */}
      <div className="bg-navy-500 text-white px-6 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute top-3 right-3"><LanguageToggle /></div>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-beige-400" />
          <span className="font-serif text-lg">Munasaba</span>
        </div>
        <div className="text-xs uppercase tracking-widest text-beige-400 mb-2 font-medium">
          {lang === 'ar' ? 'دعوة لاستلام مناسبة' : 'Event handoff'}
        </div>
        <h1 className="font-serif text-3xl mb-2">{event?.couple_names}</h1>
        {event?.wedding_date && (
          <p className="text-sm text-brand-100">{new Date(event.wedding_date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
      </div>

      <div className="flex-1 px-5 py-6 -mt-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-beige-200 p-5 shadow-sm">
          <p className="text-sm text-smoke-700 leading-relaxed">
            {lang === 'ar'
              ? 'تم إعداد مناسبتك من قِبَل منظم الفعاليات. أنشئ حساباً (أو سجل دخول) لاستلامها — ستصبح صاحب المناسبة الوحيد بكل صلاحياتها.'
              : 'Your event has been set up by your event planner. Create an account (or sign in) to take ownership — you\'ll become the sole owner with full access.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex bg-beige-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition !min-h-0 ${mode === 'signup' ? 'bg-white text-navy-500 shadow-sm' : 'text-smoke-700'}`}>
            {lang === 'ar' ? 'حساب جديد' : 'Create account'}
          </button>
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition !min-h-0 ${mode === 'login' ? 'bg-white text-navy-500 shadow-sm' : 'text-smoke-700'}`}>
            {lang === 'ar' ? 'لدي حساب' : 'I have an account'}
          </button>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleAuth}
          disabled={submitting}
          className="h-12 w-full bg-white border border-beige-200 rounded-xl flex items-center justify-center gap-3 font-medium text-navy-500 disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
            <path fill="#FBBC04" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.22V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {lang === 'ar' ? 'متابعة مع Google' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-beige-200" />
          <span className="text-xs text-smoke-500">{lang === 'ar' ? 'أو' : 'or'}</span>
          <div className="flex-1 h-px bg-beige-200" />
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="relative">
              <User className={`absolute top-3.5 ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-smoke-500`} />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={`w-full h-12 bg-white border border-beige-200 rounded-xl ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-navy-500 text-sm focus:outline-none focus:border-brand-500`}
              />
            </div>
          )}

          <div className="relative">
            <Mail className={`absolute top-3.5 ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-smoke-500`} />
            <input
              type="email"
              placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full h-12 bg-white border border-beige-200 rounded-xl ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-navy-500 text-sm focus:outline-none focus:border-brand-500`}
              dir="ltr"
            />
          </div>

          <div className="relative">
            <Lock className={`absolute top-3.5 ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-smoke-500`} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full h-12 bg-white border border-beige-200 rounded-xl ${dir === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-navy-500 text-sm focus:outline-none focus:border-brand-500`}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-3 ${dir === 'rtl' ? 'left-3' : 'right-3'} text-smoke-500 !min-h-0 w-6 h-6 flex items-center justify-center`}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-12 w-full bg-brand-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                {mode === 'signup' ? (lang === 'ar' ? 'إنشاء حساب واستلام' : 'Create & claim') : (lang === 'ar' ? 'تسجيل دخول واستلام' : 'Sign in & claim')}
                <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-smoke-500 text-center mt-2 leading-relaxed px-4">
          {lang === 'ar'
            ? 'بإنشاء حساب فإنك توافق على شروط الخدمة وسياسة الخصوصية'
            : 'By creating an account you agree to our Terms and Privacy Policy'}
        </p>
      </div>
    </div>
  )
}

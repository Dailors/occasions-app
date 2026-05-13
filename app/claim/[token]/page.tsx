'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Sparkles, Loader2, CheckCircle2, XCircle, Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react'

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>()
  const { t, dir, lang } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState<'signup' | 'login'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser]         = useState<any>(null)
  const [claiming, setClaiming] = useState(false)
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: ev } = await supabase.from('events')
        .select('id, couple_names, wedding_date, claimed_at')
        .eq('claim_token', token).maybeSingle()

      if (!ev) { setError(lang === 'ar' ? 'رابط غير صالح' : 'Invalid link'); setLoading(false); return }
      if (ev.claimed_at) { setError(lang === 'ar' ? 'تم استلام هذه المناسبة مسبقاً' : 'This event has already been claimed'); setLoading(false); return }
      setEvent(ev)

      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) setUser(u)
      setLoading(false)
    }
    load()
  }, [token])

  useEffect(() => {
    if (user && event && !claiming && !success) claimEvent()
  }, [user, event])

  const claimEvent = async () => {
    if (!user || !event) return
    setClaiming(true); setError('')
    try {
      const { error: claimErr } = await supabase.rpc('claim_event', { token })
      if (claimErr) { setError(claimErr.message); setClaiming(false); return }
      setSuccess(true)
      setTimeout(() => router.push(`/dashboard/${event.id}`), 2000)
    } catch (err: any) {
      setError(err.message ?? 'Failed'); setClaiming(false)
    }
  }

  const handleSubmit = async () => {
    if (!email || !password) { setError(lang === 'ar' ? 'يرجى ملء الحقول' : 'Please fill all fields'); return }
    if (mode === 'signup' && !fullName.trim()) { setError(lang === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name'); return }
    setError(''); setSubmitting(true)
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName, role: 'host' } }
        })
        if (err) { setError(err.message); setSubmitting(false); return }
        if (data.session) { setUser(data.user) }
        else {
          const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({ email, password })
          if (e2) { setError(lang === 'ar' ? 'تم الإنشاء. تحقق من بريدك.' : 'Account created. Check your email.'); setSubmitting(false); return }
          if (d2.user) setUser(d2.user)
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) { setError(err.message); setSubmitting(false); return }
        if (data.user) setUser(data.user)
      }
    } catch (err: any) { setError(err.message ?? 'Error') }
    setSubmitting(false)
  }

  const handleGoogle = async () => {
    setSubmitting(true)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/claim/${token}`, queryParams: { prompt: 'select_account' } }
    })
    if (err) { setError(err.message); setSubmitting(false) }
  }

  if (loading) return <div className="app-container flex items-center justify-center" dir={dir}><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>

  if (error && !event) return (
    <div className="app-container flex flex-col items-center justify-center p-8 gap-4 text-center" dir={dir}>
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center"><XCircle className="w-8 h-8 text-red-500" /></div>
      <h2 className="font-serif text-2xl text-navy-500">{error}</h2>
      <Link href="/auth/login" className="text-brand-500 text-sm font-medium">{t('auth.sign_in')}</Link>
    </div>
  )

  if (success) return (
    <div className="app-container flex flex-col items-center justify-center p-8 gap-4 text-center" dir={dir}>
      <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
      <h2 className="font-serif text-2xl text-navy-500">{lang === 'ar' ? 'تم استلام المناسبة!' : 'Event claimed!'}</h2>
      <p className="text-sm text-smoke-700">{lang === 'ar' ? 'جاري التحويل...' : 'Redirecting...'}</p>
      <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
    </div>
  )

  if (user && claiming) return (
    <div className="app-container flex flex-col items-center justify-center p-8 gap-4 text-center" dir={dir}>
      <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      <p className="text-sm text-smoke-700">{lang === 'ar' ? 'جاري استلام المناسبة...' : 'Claiming your event...'}</p>
    </div>
  )

  return (
    <div className="app-container min-h-screen flex flex-col" dir={dir}>
      <div className="bg-navy-500 text-white px-6 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute top-3 right-3"><LanguageToggle /></div>
        <div className="flex items-center gap-2 mb-6"><Sparkles className="w-5 h-5 text-beige-400" /><span className="font-serif text-lg">{t('app.name')}</span></div>
        <div className="text-xs uppercase tracking-widest text-beige-400 mb-2 font-medium">{lang === 'ar' ? 'دعوة لاستلام مناسبة' : 'Event handoff'}</div>
        <h1 className="font-serif text-3xl mb-2">{event?.couple_names}</h1>
        {event?.wedding_date && (
          <p className="text-sm text-brand-100">{new Date(event.wedding_date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
      </div>

      <div className="flex-1 px-5 py-6 -mt-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-beige-200 p-5 shadow-sm">
          <p className="text-sm text-smoke-700 leading-relaxed">
            {lang === 'ar' ? 'تم إعداد مناسبتك. أنشئ حساباً لاستلامها وإدارتها بشكل كامل.' : 'Your event is ready. Create an account to take full ownership.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        <div className="flex bg-beige-100 rounded-xl p-1 gap-1">
          {(['signup', 'login'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition !min-h-0 ${mode === m ? 'bg-white text-navy-500 shadow-sm' : 'text-smoke-700'}`}>
              {m === 'signup' ? (lang === 'ar' ? 'حساب جديد' : 'Create account') : (lang === 'ar' ? 'لدي حساب' : 'I have an account')}
            </button>
          ))}
        </div>

        <button onClick={handleGoogle} disabled={submitting}
          className="h-12 w-full bg-white border border-beige-200 rounded-xl flex items-center justify-center gap-3 font-medium text-navy-500 disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
            <path fill="#FBBC04" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.22V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.google')}
        </button>

        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-beige-200" /><span className="text-xs text-smoke-500">{t('auth.or')}</span><div className="flex-1 h-px bg-beige-200" /></div>

        <div className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="relative">
              <User className={`absolute top-3.5 ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-smoke-500`} />
              <input type="text" placeholder={t('auth.full_name')} value={fullName} onChange={e => setFullName(e.target.value)}
                className={`w-full h-12 bg-white border border-beige-200 rounded-xl ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-navy-500 text-sm focus:outline-none focus:border-brand-500`} />
            </div>
          )}
          <div className="relative">
            <Mail className={`absolute top-3.5 ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-smoke-500`} />
            <input type="email" placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} dir="ltr"
              className={`w-full h-12 bg-white border border-beige-200 rounded-xl ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-navy-500 text-sm focus:outline-none focus:border-brand-500`} />
          </div>
          <div className="relative">
            <Lock className={`absolute top-3.5 ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-smoke-500`} />
            <input type={showPw ? 'text' : 'password'} placeholder={t('auth.password')} value={password} onChange={e => setPassword(e.target.value)} dir="ltr"
              className={`w-full h-12 bg-white border border-beige-200 rounded-xl ${dir === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-navy-500 text-sm focus:outline-none focus:border-brand-500`} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className={`absolute top-3 ${dir === 'rtl' ? 'left-3' : 'right-3'} text-smoke-500 !min-h-0 w-6 h-6 flex items-center justify-center`}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="h-12 w-full bg-brand-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>{mode === 'signup' ? (lang === 'ar' ? 'إنشاء واستلام' : 'Create & claim') : (lang === 'ar' ? 'دخول واستلام' : 'Sign in & claim')}<ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </div>

        <p className="text-xs text-smoke-500 text-center px-4">
          {lang === 'ar' ? 'بإنشاء حساب توافق على الشروط وسياسة الخصوصية' : 'By creating an account you agree to our Terms & Privacy Policy'}
        </p>
      </div>
    </div>
  )
}

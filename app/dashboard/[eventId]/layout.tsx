'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import {
  ArrowLeft, Menu, X, Sparkles, Lock,
  LayoutGrid, Image as ImageIcon, Wand2, QrCode, Settings,
  CreditCard, FileText, Shield, LogOut, MessageCircleQuestion, Send,
} from 'lucide-react'

export default function EventLayout({ children }: { children: React.ReactNode }) {
  const { eventId } = useParams<{ eventId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const { t, dir, lang } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const [showHandoffOnly, setShowHandoffOnly] = useState(false)
  const supabase = createClient()

  // Access control check
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const { data: event } = await supabase.from('events')
        .select('admin_id, created_by_manager, claimed_at').eq('id', eventId).single()

      if (!event) {
        setBlocked(true)
        setChecking(false)
        return
      }

      // If manager viewing an event they manage
      if (profile?.role === 'manager' && event.created_by_manager === user.id) {
        // BEFORE claim → can only access /handoff page
        // AFTER claim → blocked entirely
        if (event.claimed_at) {
          setBlocked(true)
        } else {
          // Only allow handoff page for unclaimed manager events
          const isHandoff = pathname.endsWith('/handoff')
          if (!isHandoff) {
            router.push(`/dashboard/${eventId}/handoff`)
            return
          }
          setShowHandoffOnly(true)
        }
      }
      // Host (admin_id matches) → full access, no blocking
      else if (event.admin_id !== user.id) {
        setBlocked(true)
      }

      setChecking(false)
    }
    check()
  }, [eventId, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  if (checking) {
    return <div className="app-container flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (blocked) {
    return (
      <div className="app-container min-h-screen flex flex-col" dir={dir}>
        <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center justify-between safe-area-inset-top">
          <Link href="/dashboard" className="flex items-center gap-2 text-white !min-h-0">
            <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-smoke-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-smoke-500" />
          </div>
          <h2 className="font-serif text-2xl text-navy-500">
            {lang === 'ar' ? 'لا يمكنك الدخول' : "You can't enter this event"}
          </h2>
          <p className="text-sm text-smoke-700 max-w-xs">
            {lang === 'ar'
              ? 'لقد تم تسليم هذه المناسبة للعميل. لم يعد بإمكانك رؤية الصور أو التعديل.'
              : 'This event has been handed off to the client. You no longer have access to its content.'}
          </p>
          <Link href="/dashboard" className="mt-4 h-11 px-6 bg-brand-500 text-white rounded-xl font-medium flex items-center">
            {lang === 'ar' ? 'العودة للمناسبات' : 'Back to events'}
          </Link>
        </div>
      </div>
    )
  }

  const navItems = showHandoffOnly ? [
    { href: `/dashboard/${eventId}/handoff`, icon: Send, label: t('event.handoff') },
  ] : [
    { href: `/dashboard/${eventId}`,          icon: LayoutGrid,  label: t('event.overview')    },
    { href: `/dashboard/${eventId}/media`,    icon: ImageIcon,   label: t('event.media')       },
    { href: `/dashboard/${eventId}/ai`,       icon: Wand2,       label: 'AI Suggestions'       },
    { href: `/dashboard/${eventId}/qr`,       icon: QrCode,      label: t('event.upload_link') },
    { href: `/dashboard/${eventId}/settings`, icon: Settings,    label: t('event.settings')    },
  ]

  return (
    <>
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-navy-500/60 z-40" onClick={() => setMenuOpen(false)} />
          <div className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} bottom-0 w-[80%] max-w-[320px] bg-beige-50 z-50 shadow-2xl flex flex-col safe-area-inset-top`}>
            <div className="p-5 bg-navy-500 flex items-center justify-between">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-beige-400" /><span className="font-serif text-xl text-white">{t('app.name')}</span></div>
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-3 py-3 flex-1 overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase text-smoke-500 px-3 mb-2">Event</p>
              {navItems.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl ${active ? 'bg-brand-500 text-white' : 'text-navy-500'}`}
                    onClick={() => setMenuOpen(false)}>
                    <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-brand-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
              <div className="h-px bg-beige-200 my-3" />
              <p className="text-[10px] font-semibold uppercase text-smoke-500 px-3 mb-2">{t('app.name')}</p>
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500" onClick={() => setMenuOpen(false)}>
                <ArrowLeft className={`w-4 h-4 text-brand-500 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-sm">{t('dash.my_events')}</span>
              </Link>
              <Link href="/support" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500" onClick={() => setMenuOpen(false)}>
                <MessageCircleQuestion className="w-4 h-4 text-brand-500" />
                <span className="text-sm">Help & Support</span>
              </Link>
              <LanguageToggle />
              <div className="h-px bg-beige-200 my-3" />
              <Link href="/terms" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500" onClick={() => setMenuOpen(false)}>
                <FileText className="w-4 h-4 text-brand-500" /><span className="text-sm">{t('legal.terms_title')}</span>
              </Link>
              <Link href="/privacy" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500" onClick={() => setMenuOpen(false)}>
                <Shield className="w-4 h-4 text-brand-500" /><span className="text-sm">{t('legal.privacy_title')}</span>
              </Link>
            </div>
            <div className="p-3 border-t border-beige-200">
              <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-600">
                <LogOut className="w-4 h-4" /><span className="text-sm font-medium">{t('auth.sign_out')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center justify-between safe-area-inset-top">
        <button onClick={() => setMenuOpen(true)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0"><Menu className="w-6 h-6" /></button>
        <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-beige-400" /><span className="font-serif text-lg text-white">{t('app.name')}</span></div>
        <div className="w-10" />
      </div>

      {children}
    </>
  )
}

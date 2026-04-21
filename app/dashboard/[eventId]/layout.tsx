'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import {
  ArrowLeft, Menu, X, Sparkles,
  LayoutGrid, Image as ImageIcon, Clapperboard, QrCode, Settings,
  Wand2, CreditCard, FileText, Shield, LogOut,
} from 'lucide-react'

export default function EventLayout({ children }: { children: React.ReactNode }) {
  const { eventId } = useParams<{ eventId: string }>()
  const pathname = usePathname()
  const { t, dir } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const navItems = [
    { href: `/dashboard/${eventId}`,          icon: LayoutGrid,    label: t('event.overview')    },
    { href: `/dashboard/${eventId}/media`,    icon: ImageIcon,     label: t('event.media')       },
    { href: `/dashboard/${eventId}/videos`,   icon: Clapperboard,  label: t('event.videos')      },
    { href: `/dashboard/${eventId}/stories`,  icon: Wand2,         label: t('event.ai_stories')  },
    { href: `/dashboard/${eventId}/qr`,       icon: QrCode,        label: t('event.upload_link') },
    { href: `/dashboard/${eventId}/settings`, icon: Settings,      label: t('event.settings')    },
  ]

  return (
    <>
      {/* Slide-out sidebar */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-navy-500/60 z-40 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} bottom-0 w-[80%] max-w-[320px] bg-beige-50 z-50 shadow-2xl ${dir === 'rtl' ? 'animate-slide-in-right' : 'animate-slide-in-left'} flex flex-col safe-area-inset-top`}>
            <div className="p-5 bg-navy-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-beige-400" />
                <span className="font-serif text-xl text-white">{t('app.name')}</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-3 py-3 flex-1 overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase text-smoke-500 px-3 mb-2">{t('event.overview')}</p>
              {navItems.map(item => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl ${
                      active ? 'bg-brand-500 text-white' : 'text-navy-500 hover:bg-beige-100'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-brand-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}

              <div className="h-px bg-beige-200 my-3" />

              <p className="text-[10px] font-semibold uppercase text-smoke-500 px-3 mb-2">
                {t('app.name')}
              </p>
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <ArrowLeft className={`w-4 h-4 text-brand-500 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-sm">{t('dash.my_events')}</span>
              </Link>
              <Link href="/dashboard/credits" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <CreditCard className="w-4 h-4 text-brand-500" />
                <span className="text-sm">{t('dash.credits')}</span>
              </Link>

              <LanguageToggle />

              <div className="h-px bg-beige-200 my-3" />

              <Link href="/terms" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <FileText className="w-4 h-4 text-brand-500" />
                <span className="text-sm">{t('legal.terms_title')}</span>
              </Link>
              <Link href="/privacy" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <Shield className="w-4 h-4 text-brand-500" />
                <span className="text-sm">{t('legal.privacy_title')}</span>
              </Link>
            </div>

            <div className="p-3 border-t border-beige-200">
              <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">{t('auth.sign_out')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Top bar with hamburger */}
      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center justify-between safe-area-inset-top">
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(true)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/dashboard" className="text-white/70 text-sm flex items-center gap-1 !min-h-0">
            <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            {t('common.back')}
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-beige-400" />
          <span className="font-serif text-lg text-white">{t('app.name')}</span>
        </div>
        <div className="w-10" />
      </div>

      {children}
    </>
  )
}

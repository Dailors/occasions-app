'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { MessageCircleQuestion, Send, Sparkles, ArrowLeft, Menu, X } from 'lucide-react'
import { LanguageToggle } from '@/components/LanguageToggle'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CreditCard, FileText, Shield, LogOut } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

export default function SupportPage() {
  const { lang, dir, t } = useI18n()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: lang === 'ar'
      ? 'مرحباً! أنا مساعدك في تطبيق Occasions. اسألني أي شيء عن كيفية استخدام التطبيق.'
      : "Hi! I'm your Occasions assistant. Ask me anything about using the app."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], lang }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? (lang === 'ar' ? 'عذراً، حدث خطأ' : 'Sorry, something went wrong') }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'ar' ? 'خطأ في الاتصال' : 'Connection error' }])
    }
    setLoading(false)
  }

  return (
    <div className="app-container min-h-screen flex flex-col" dir={dir}>
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-navy-500/60 z-40 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} bottom-0 w-[80%] max-w-[320px] bg-beige-50 z-50 shadow-2xl flex flex-col safe-area-inset-top`}>
            <div className="p-5 bg-navy-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-beige-400" />
                <span className="font-serif text-xl text-white">Occasions</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 py-3 flex-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <Calendar className="w-4 h-4 text-brand-500" /><span className="text-sm">My events</span>
              </Link>
              <Link href="/dashboard/credits" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <CreditCard className="w-4 h-4 text-brand-500" /><span className="text-sm">Credits</span>
              </Link>
              <LanguageToggle />
              <div className="h-px bg-beige-200 my-3" />
              <Link href="/terms" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <FileText className="w-4 h-4 text-brand-500" /><span className="text-sm">Terms</span>
              </Link>
              <Link href="/privacy" className="flex items-center gap-3 px-3 py-3 rounded-xl text-navy-500 hover:bg-beige-100" onClick={() => setMenuOpen(false)}>
                <Shield className="w-4 h-4 text-brand-500" /><span className="text-sm">Privacy</span>
              </Link>
            </div>
            <div className="p-3 border-t border-beige-200">
              <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-600">
                <LogOut className="w-4 h-4" /><span className="text-sm font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center justify-between safe-area-inset-top">
        <button onClick={() => setMenuOpen(true)} className="w-10 h-10 flex items-center justify-center text-white !min-h-0">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-beige-400" />
          <span className="font-serif text-lg text-white">Occasions</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="bg-brand-500 px-5 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircleQuestion className="w-5 h-5 text-beige-400" />
          <h1 className="font-serif text-2xl text-white">Support</h1>
        </div>
        <p className="text-sm text-brand-100">{lang === 'ar' ? 'مساعد Occasions الذكي' : 'Occasions AI assistant'}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user' ? 'bg-brand-500 text-white' : 'bg-beige-50 text-navy-500 border border-beige-200'
            }`}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-beige-50 border border-beige-200 rounded-2xl px-4 py-2.5 text-sm text-smoke-500">
              <Sparkles className="w-4 h-4 inline animate-pulse" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-3 bg-beige-100 border-t border-beige-200 safe-area-inset-bottom">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="flex-1 h-11 px-4 rounded-full border border-smoke-100 focus:border-brand-500 outline-none bg-white text-sm"
            placeholder={lang === 'ar' ? 'اسألني أي شيء...' : 'Ask me anything...'} />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-11 h-11 bg-brand-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 !min-h-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

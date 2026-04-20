'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { ArrowLeft, CreditCard, Sparkles, Zap } from 'lucide-react'

const PACKAGES = [
  { credits: 1,   price: 39.99,  popular: false },
  { credits: 5,   price: 179.99, popular: true,  save: 20 },
  { credits: 10,  price: 329.99, popular: false, save: 70 },
  { credits: 25,  price: 749.99, popular: false, save: 250 },
]

export default function CreditsPage() {
  const { t, lang, dir } = useI18n()
  const supabase = createClient()

  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }
      const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single()
      setCredits(data?.credits ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const handleBuy = (pkg: typeof PACKAGES[number]) => {
    alert(
      lang === 'ar'
        ? `الدفع قيد التطوير. سيتم تفعيله قريباً لـ ${pkg.credits} رصيد بسعر ${pkg.price} ريال.`
        : `Payments coming soon! You chose ${pkg.credits} credits for ${pkg.price} SAR.`
    )
  }

  return (
    <div className="app-container min-h-screen" dir={dir}>
      <div className="sticky top-0 z-30 bg-navy-500 px-4 h-14 flex items-center safe-area-inset-top">
        <Link href="/dashboard" className="flex items-center gap-2 text-white !min-h-0">
          <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium">{t('common.back')}</span>
        </Link>
      </div>

      <div className="bg-brand-500 px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-beige-400" />
          <h1 className="font-serif text-2xl text-white">{t('dash.buy_credits')}</h1>
        </div>
        <p className="text-sm text-brand-100">
          {lang === 'ar' ? `لديك ${credits} رصيد حالياً` : `You have ${credits} credits`}
        </p>
      </div>

      <div className="px-5 py-5 -mt-5 flex flex-col gap-3">
        {PACKAGES.map(pkg => (
          <button
            key={pkg.credits}
            onClick={() => handleBuy(pkg)}
            className={`card-warm rounded-2xl p-5 text-left relative hover:shadow-md transition-all ${
              pkg.popular ? 'border-2 border-brand-500' : ''
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-2 right-4 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {lang === 'ar' ? 'الأكثر شعبية' : 'Popular'}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span className="text-xl font-bold text-navy-500">{pkg.credits}</span>
                  <span className="text-sm text-smoke-500">
                    {lang === 'ar' ? (pkg.credits === 1 ? 'رصيد' : 'رصيد') : (pkg.credits === 1 ? 'credit' : 'credits')}
                  </span>
                </div>
                {pkg.save && (
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <Zap className="w-3 h-3" />
                    {lang === 'ar' ? `وفّر ${pkg.save} ريال` : `Save ${pkg.save} SAR`}
                  </div>
                )}
              </div>
              <div className="text-end">
                <div className="text-xl font-bold text-brand-500">{pkg.price}</div>
                <div className="text-xs text-smoke-500">SAR</div>
              </div>
            </div>
          </button>
        ))}

        <p className="text-xs text-smoke-500 text-center mt-4 leading-relaxed">
          {lang === 'ar'
            ? 'كل مناسبة تستهلك رصيد واحد. الرصيد لا ينتهي.'
            : 'Each event uses 1 credit. Credits never expire.'}
        </p>
      </div>
    </div>
  )
}

'use client'

import { useI18n, type Lang } from '@/lib/i18n'
import { Languages } from 'lucide-react'

export function LanguageToggle() {
  const { lang, setLang } = useI18n()

  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <Languages className="w-4 h-4 text-brand-500" />
      <div className="flex-1 text-sm text-navy-500">
        {lang === 'en' ? 'Language' : 'اللغة'}
      </div>
      <div className="flex bg-beige-200 rounded-full p-0.5">
        {(['en', 'ar'] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors !min-h-0 ${
              lang === l ? 'bg-navy-500 text-white' : 'text-navy-500'
            }`}
          >
            {l === 'en' ? 'EN' : 'عربي'}
          </button>
        ))}
      </div>
    </div>
  )
}

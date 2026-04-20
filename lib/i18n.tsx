// lib/i18n.ts
// Simple two-language dictionary. No external library needed.
// Usage: const { t, lang, setLang } = useI18n()

'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'en' | 'ar'

export const translations = {
  en: {
    // Common
    'app.name':            'Occasions',
    'common.back':         'Back',
    'common.save':         'Save',
    'common.cancel':       'Cancel',
    'common.copy':         'Copy',
    'common.copied':       'Copied!',
    'common.share':        'Share',
    'common.download':     'Download',
    'common.loading':      'Loading...',
    'common.generate':     'Generate',
    'common.regenerate':   'Regenerate',
    'common.delete':       'Delete',
    'common.edit':         'Edit',
    'common.continue':     'Continue',
    'common.close':        'Close',

    // Auth
    'auth.welcome_back':       'Welcome back',
    'auth.sign_in_subtitle':   'Sign in to manage your events',
    'auth.create_account':     'Create account',
    'auth.signup_subtitle':    'Start collecting your special moments',
    'auth.email':              'Email',
    'auth.password':           'Password',
    'auth.full_name':          'Full name',
    'auth.sign_in':            'Sign in',
    'auth.sign_up':            'Sign up',
    'auth.sign_out':           'Sign out',
    'auth.sign_in_with_google':'Continue with Google',
    'auth.sign_up_with_google':'Sign up with Google',
    'auth.or':                 'or',
    'auth.new_here':           'New here?',
    'auth.have_account':       'Already have an account?',
    'auth.terms_agree':        'By continuing you agree to our',
    'auth.terms':              'Terms',
    'auth.privacy':            'Privacy Policy',
    'auth.and':                'and',
    'auth.role_host':          'Host',
    'auth.role_host_desc':     'My own event',
    'auth.role_manager':       'Event Manager',
    'auth.role_manager_desc':  'For my clients',
    'auth.check_email':        'Check your email',
    'auth.code_sent':          'We sent a 6-digit code to',
    'auth.verification_code':  'Verification code',
    'auth.verify_continue':    'Verify & continue',
    'auth.didnt_get_code':     "Didn't get a code? Check your spam folder, or click the link in the email.",

    // Dashboard
    'dash.hi':               'Hi',
    'dash.my_events':        'My events',
    'dash.credits':          'Credits',
    'dash.buy_credits':      'Buy credits',
    'dash.create_new_event': 'Create new event',
    'dash.no_events':        'No events yet',
    'dash.no_events_desc':   'Create one to start collecting memories.',
    'dash.files':            'files',
    'dash.guests':           'guests',
    'dash.awaiting_host':    'Awaiting host',
    'dash.send_claim':       'Send claim link to host →',

    // Event
    'event.couple_name':      'Couple / Event name',
    'event.event_date':       'Event date',
    'event.location':         'Location',
    'event.women_pin':        "Women's album PIN (optional)",
    'event.women_pin_hint':   'Guests will need this PIN to access the women-only album.',
    'event.create_event':     'Create event (uses 1 credit)',
    'event.overview':         'Overview',
    'event.upload_link':      'Upload link & QR',
    'event.ai_stories':       'AI Stories',
    'event.videos':           'Videos',
    'event.media':            'All media',
    'event.settings':         'Settings',
    'event.handoff':          'Send to client',
    'event.claim_link':       'Claim link',
    'event.send_via_wa':      'Send via WhatsApp',
    'event.upload_url_label': 'Guest upload link',
    'event.share_with_guests':'Share this with your guests',

    // Albums
    'album.mixed':   'All guests',
    'album.men':     'Men only',
    'album.women':   'Women only',
    'album.enter_pin': 'Enter PIN to view',

    // Stories
    'stories.title':       'AI Stories',
    'stories.subtitle':    'Let AI pick your best photos and write captions, ready to post.',
    'stories.generate':    'Generate 6 AI packages',
    'stories.none_yet':    'No AI stories yet',
    'stories.need_photos': 'Upload at least 6 photos, then click Generate above.',
    'stories.photos':      'photos',
    'stories.story':       'Story',
    'stories.post':        'Post',
    'stories.photo_dump':  'Photo Dump',
    'stories.download_photos': 'Download photos',

    // Videos
    'video.generate_title':   'Cinematic video',
    'video.generate_hint':    'Our AI will create a unique video for your event.',
    'video.style':            'Choose a style',
    'video.style_romantic':   'Romantic — slow, emotional, couple-focused',
    'video.style_party':      'Party — high-energy, fast cuts, dance',
    'video.style_family':     'Family — warm, emotional, full-day recap',
    'video.duration':         'Duration',
    'video.music_mood':       'Music mood',
    'video.generate_btn':     'Generate my video',
    'video.rendering':        'Rendering your video...',
    'video.download_highlight':'🎬 Wedding Highlight',
    'video.download_reel':    '📱 Instagram Reel',
    'video.download_status':  '💬 WhatsApp Status',

    // Legal
    'legal.privacy_title':   'Privacy Policy',
    'legal.terms_title':     'Terms & Conditions',
    'legal.last_updated':    'Last updated',
    'legal.back_to_app':     'Back to app',
  },
  ar: {
    // Common
    'app.name':            'مناسبات',
    'common.back':         'رجوع',
    'common.save':         'حفظ',
    'common.cancel':       'إلغاء',
    'common.copy':         'نسخ',
    'common.copied':       'تم النسخ!',
    'common.share':        'مشاركة',
    'common.download':     'تحميل',
    'common.loading':      'جاري التحميل...',
    'common.generate':     'إنشاء',
    'common.regenerate':   'إعادة الإنشاء',
    'common.delete':       'حذف',
    'common.edit':         'تعديل',
    'common.continue':     'متابعة',
    'common.close':        'إغلاق',

    // Auth
    'auth.welcome_back':       'مرحباً بعودتك',
    'auth.sign_in_subtitle':   'سجّل الدخول لإدارة مناسباتك',
    'auth.create_account':     'إنشاء حساب',
    'auth.signup_subtitle':    'ابدأ بجمع لحظاتك الخاصة',
    'auth.email':              'البريد الإلكتروني',
    'auth.password':           'كلمة المرور',
    'auth.full_name':          'الاسم الكامل',
    'auth.sign_in':            'تسجيل الدخول',
    'auth.sign_up':            'إنشاء حساب',
    'auth.sign_out':           'تسجيل الخروج',
    'auth.sign_in_with_google':'المتابعة عبر جوجل',
    'auth.sign_up_with_google':'التسجيل عبر جوجل',
    'auth.or':                 'أو',
    'auth.new_here':           'جديد هنا؟',
    'auth.have_account':       'لديك حساب بالفعل؟',
    'auth.terms_agree':        'بالمتابعة أنت توافق على',
    'auth.terms':              'الشروط',
    'auth.privacy':            'سياسة الخصوصية',
    'auth.and':                'و',
    'auth.role_host':          'مضيف',
    'auth.role_host_desc':     'مناسبتي الخاصة',
    'auth.role_manager':       'منظم مناسبات',
    'auth.role_manager_desc':  'لعملائي',
    'auth.check_email':        'افحص بريدك الإلكتروني',
    'auth.code_sent':          'أرسلنا رمزاً من 6 أرقام إلى',
    'auth.verification_code':  'رمز التحقق',
    'auth.verify_continue':    'تحقق ومتابعة',
    'auth.didnt_get_code':     'لم يصلك الرمز؟ افحص بريدك المزعج، أو اضغط الرابط في الإيميل.',

    // Dashboard
    'dash.hi':               'أهلاً',
    'dash.my_events':        'مناسباتي',
    'dash.credits':          'الرصيد',
    'dash.buy_credits':      'شراء رصيد',
    'dash.create_new_event': 'إنشاء مناسبة جديدة',
    'dash.no_events':        'لا توجد مناسبات بعد',
    'dash.no_events_desc':   'أنشئ واحدة للبدء بجمع الذكريات.',
    'dash.files':            'ملف',
    'dash.guests':           'ضيف',
    'dash.awaiting_host':    'بانتظار المضيف',
    'dash.send_claim':       '← أرسل رابط المطالبة للمضيف',

    // Event
    'event.couple_name':      'اسم المناسبة / العروسين',
    'event.event_date':       'تاريخ المناسبة',
    'event.location':         'الموقع',
    'event.women_pin':        'رمز ألبوم النساء (اختياري)',
    'event.women_pin_hint':   'سيحتاج الضيوف لهذا الرمز لدخول ألبوم النساء.',
    'event.create_event':     'إنشاء المناسبة (خصم رصيد واحد)',
    'event.overview':         'نظرة عامة',
    'event.upload_link':      'رابط الرفع و QR',
    'event.ai_stories':       'قصص الذكاء الاصطناعي',
    'event.videos':           'الفيديوهات',
    'event.media':            'جميع الوسائط',
    'event.settings':         'الإعدادات',
    'event.handoff':          'إرسال للعميل',
    'event.claim_link':       'رابط المطالبة',
    'event.send_via_wa':      'إرسال عبر واتساب',
    'event.upload_url_label': 'رابط رفع الضيوف',
    'event.share_with_guests':'شارك هذا الرابط مع ضيوفك',

    // Albums
    'album.mixed':   'جميع الضيوف',
    'album.men':     'للرجال فقط',
    'album.women':   'للنساء فقط',
    'album.enter_pin': 'أدخل الرمز للدخول',

    // Stories
    'stories.title':       'قصص بالذكاء الاصطناعي',
    'stories.subtitle':    'دع الذكاء الاصطناعي يختار أفضل صورك ويكتب التعليقات، جاهزة للنشر.',
    'stories.generate':    'إنشاء 6 حزم بالذكاء الاصطناعي',
    'stories.none_yet':    'لا توجد قصص بعد',
    'stories.need_photos': 'ارفع 6 صور على الأقل، ثم اضغط إنشاء أعلاه.',
    'stories.photos':      'صور',
    'stories.story':       'قصة',
    'stories.post':        'منشور',
    'stories.photo_dump':  'ألبوم صور',
    'stories.download_photos': 'تحميل الصور',

    // Videos
    'video.generate_title':   'فيديو سينمائي',
    'video.generate_hint':    'سيقوم الذكاء الاصطناعي بإنشاء فيديو فريد لمناسبتك.',
    'video.style':            'اختر النمط',
    'video.style_romantic':   'رومانسي — هادئ، عاطفي، محوره العروسين',
    'video.style_party':      'احتفالي — حماسي، قطع سريعة، رقص',
    'video.style_family':     'عائلي — دافئ، عاطفي، تلخيص اليوم كاملاً',
    'video.duration':         'المدة',
    'video.music_mood':       'مزاج الموسيقى',
    'video.generate_btn':     'إنشاء الفيديو',
    'video.rendering':        'جاري تجهيز الفيديو...',
    'video.download_highlight':'🎬 فيديو المناسبة',
    'video.download_reel':    '📱 ريل إنستجرام',
    'video.download_status':  '💬 ستوري واتساب',

    // Legal
    'legal.privacy_title':   'سياسة الخصوصية',
    'legal.terms_title':     'الشروط والأحكام',
    'legal.last_updated':    'آخر تحديث',
    'legal.back_to_app':     'العودة للتطبيق',
  },
} as const

type TranslationKey = keyof typeof translations.en

interface I18nContext {
  lang:    Lang
  setLang: (l: Lang) => void
  t:       (key: TranslationKey) => string
  dir:     'ltr' | 'rtl'
}

const Ctx = createContext<I18nContext>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  dir: 'ltr',
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null
    if (saved === 'ar' || saved === 'en') {
      setLangState(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    }
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    if (typeof window !== 'undefined') localStorage.setItem('lang', l)
  }

  const t = (key: TranslationKey): string => {
    return translations[lang][key] ?? translations.en[key] ?? key
  }

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>
}

export function useI18n() {
  return useContext(Ctx)
}

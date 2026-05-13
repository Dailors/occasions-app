'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'en' | 'ar'

const dict: Record<string, Record<Lang, string>> = {
  'app.name':               { en: 'Munasaba',        ar: 'مناسبة' },
  'app.tagline':            { en: 'For every occasion.', ar: 'لكل مناسبة' },

  // Auth
  'auth.sign_in':           { en: 'Sign in',          ar: 'تسجيل الدخول' },
  'auth.sign_up':           { en: 'Sign up',          ar: 'إنشاء حساب' },
  'auth.sign_out':          { en: 'Sign out',         ar: 'تسجيل الخروج' },
  'auth.email':             { en: 'Email',            ar: 'البريد الإلكتروني' },
  'auth.password':          { en: 'Password',         ar: 'كلمة المرور' },
  'auth.full_name':         { en: 'Full name',        ar: 'الاسم الكامل' },
  'auth.company':           { en: 'Company name',     ar: 'اسم الشركة' },
  'auth.role_manager':      { en: 'Event Manager',    ar: 'منظم فعاليات' },
  'auth.role_host':         { en: 'Host',             ar: 'مضيف' },
  'auth.google':            { en: 'Continue with Google', ar: 'متابعة مع Google' },
  'auth.or':                { en: 'or',               ar: 'أو' },
  'auth.have_account':      { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  'auth.no_account':        { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  'auth.forgot_password':   { en: 'Forgot password?', ar: 'نسيت كلمة المرور؟' },
  'auth.verify_email':      { en: 'Check your email', ar: 'تحقق من بريدك' },
  'auth.otp_sent':          { en: 'We sent a 6-digit code to', ar: 'أرسلنا رمزاً مكوناً من 6 أرقام إلى' },
  'auth.enter_code':        { en: 'Enter code',       ar: 'أدخل الرمز' },
  'auth.verify':            { en: 'Verify',           ar: 'تحقق' },
  'auth.resend':            { en: 'Resend code',      ar: 'إعادة الإرسال' },

  // Dashboard
  'dash.hi':                { en: 'Hello',            ar: 'مرحباً' },
  'dash.my_events':         { en: 'My Events',        ar: 'مناسباتي' },
  'dash.create_new_event':  { en: 'New Event',        ar: 'مناسبة جديدة' },
  'dash.no_events':         { en: 'No events yet',    ar: 'لا توجد مناسبات بعد' },
  'dash.no_events_desc':    { en: 'Create your first event to get started', ar: 'أنشئ مناسبتك الأولى للبدء' },
  'dash.credits':           { en: 'Credits',          ar: 'رصيد' },
  'dash.buy_credits':       { en: 'Buy more',         ar: 'شراء المزيد' },
  'dash.files':             { en: 'files',            ar: 'ملف' },
  'dash.guests':            { en: 'guests',           ar: 'ضيف' },
  'dash.awaiting_host':     { en: 'Awaiting host',    ar: 'بانتظار المضيف' },
  'dash.handed_off':        { en: 'Handed off',       ar: 'تم التسليم' },

  // Event
  'event.overview':         { en: 'Overview',         ar: 'نظرة عامة' },
  'event.media':            { en: 'Photos & Videos',  ar: 'الصور والفيديوهات' },
  'event.ai':               { en: 'AI Suggestions',  ar: 'مقترحات AI' },
  'event.videos':           { en: 'Videos',           ar: 'فيديوهات' },
  'event.upload_link':      { en: 'QR & Link',        ar: 'QR والرابط' },
  'event.settings':         { en: 'Settings',         ar: 'الإعدادات' },
  'event.handoff':          { en: 'Handoff to Host',  ar: 'تسليم للمضيف' },
  'event.couple_names':     { en: 'Event name',       ar: 'اسم المناسبة' },
  'event.date':             { en: 'Event date',       ar: 'تاريخ المناسبة' },
  'event.location':         { en: 'Location',         ar: 'المكان' },
  'event.create':           { en: 'Create Event',     ar: 'إنشاء المناسبة' },

  // Media
  'media.all':              { en: 'All',              ar: 'الكل' },
  'media.mixed':            { en: 'Mixed',            ar: 'مختلط' },
  'media.men':              { en: "Men's",            ar: 'الرجال' },
  'media.women':            { en: "Women's",          ar: 'النساء' },
  'media.download_all':     { en: 'Download all',     ar: 'تحميل الكل' },
  'media.enter_pin':        { en: 'Enter PIN to view', ar: 'أدخل الرمز للعرض' },

  // Upload
  'upload.title':           { en: 'Share your moments', ar: 'شارك لحظاتك' },
  'upload.subtitle':        { en: 'Upload photos & videos', ar: 'ارفع الصور والفيديوهات' },
  'upload.tap':             { en: 'Tap to upload',   ar: 'اضغط للرفع' },
  'upload.uploading':       { en: 'Uploading...',     ar: 'جاري الرفع...' },
  'upload.done':            { en: 'Uploaded!',        ar: 'تم الرفع!' },
  'upload.pin_required':    { en: 'PIN required for women\'s album', ar: 'الرمز السري مطلوب لألبوم النساء' },

  // Common
  'common.back':            { en: 'Back',             ar: 'رجوع' },
  'common.save':            { en: 'Save',             ar: 'حفظ' },
  'common.cancel':          { en: 'Cancel',           ar: 'إلغاء' },
  'common.delete':          { en: 'Delete',           ar: 'حذف' },
  'common.edit':            { en: 'Edit',             ar: 'تعديل' },
  'common.share':           { en: 'Share',            ar: 'مشاركة' },
  'common.copy':            { en: 'Copy',             ar: 'نسخ' },
  'common.copied':          { en: 'Copied!',          ar: 'تم النسخ!' },
  'common.loading':         { en: 'Loading...',       ar: 'جاري التحميل...' },
  'common.error':           { en: 'Something went wrong', ar: 'حدث خطأ ما' },
  'common.try_again':       { en: 'Try again',        ar: 'حاول مجدداً' },
  'common.yes':             { en: 'Yes',              ar: 'نعم' },
  'common.no':              { en: 'No',               ar: 'لا' },
  'common.done':            { en: 'Done',             ar: 'تم' },
  'common.next':            { en: 'Next',             ar: 'التالي' },
  'common.optional':        { en: 'Optional',         ar: 'اختياري' },

  // Legal
  'legal.terms_title':      { en: 'Terms of Service', ar: 'شروط الخدمة' },
  'legal.privacy_title':    { en: 'Privacy Policy',  ar: 'سياسة الخصوصية' },
}

const I18nContext = createContext<{
  lang: Lang
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
  toggle: () => void
}>({
  lang: 'en',
  t: (k) => k,
  dir: 'ltr',
  toggle: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved === 'ar' || saved === 'en') setLang(saved)
  }, [])

  const toggle = () => {
    const next: Lang = lang === 'en' ? 'ar' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = next
  }

  const t = (key: string): string => dict[key]?.[lang] ?? key

  return (
    <I18nContext.Provider value={{ lang, t, dir: lang === 'ar' ? 'rtl' : 'ltr', toggle }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)

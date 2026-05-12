// lib/video-templates.ts
// 16 templates. Each defines a sequence of MEDIA SLOTS.
// Each slot is either: photo (image), video (clip from event), or either (system picks best).
// Slot duration controls how long each appears on screen.

export type TemplateStyle = 'romantic' | 'hype' | 'cinematic' | 'family' | 'aesthetic'
export type TemplatePacing = 'slow' | 'medium' | 'fast'
export type SlotType     = 'photo' | 'video' | 'either'
export type Transition   = 'fade' | 'pan' | 'zoom' | 'slide' | 'whip' | 'cut'

export interface MediaSlot {
  type: SlotType
  duration: number       // seconds
  transition: Transition
}

export interface VideoTemplate {
  id:           string
  name_en:      string
  name_ar:      string
  style:        TemplateStyle
  pacing:       TemplatePacing
  description_en: string
  description_ar: string
  emoji:        string
  slots:        MediaSlot[]     // ordered sequence
  music_url:    string
  music_vibe:   string
  preview_color: string
}

// Helper to compute total duration of slots
export const totalDuration = (t: VideoTemplate) =>
  t.slots.reduce((s, slot) => s + slot.duration, 0)

// Helper: photo and video counts per template
export const slotCounts = (t: VideoTemplate) => ({
  photo: t.slots.filter(s => s.type === 'photo').length,
  video: t.slots.filter(s => s.type === 'video').length,
  either: t.slots.filter(s => s.type === 'either').length,
  total: t.slots.length,
})

// Helpers to build slot patterns quickly
const photoSlot = (duration: number, transition: Transition = 'fade'): MediaSlot => ({ type: 'photo', duration, transition })
const videoSlot = (duration: number, transition: Transition = 'cut'):  MediaSlot => ({ type: 'video', duration, transition })
const eitherSlot = (duration: number, transition: Transition = 'fade'): MediaSlot => ({ type: 'either', duration, transition })

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // ── ROMANTIC ──
  {
    id: 'romantic_slow_piano',
    name_en: 'Romantic Slow',
    name_ar: 'رومانسي هادئ',
    style: 'romantic', pacing: 'slow',
    description_en: 'Soft piano · gentle fades',
    description_ar: 'بيانو ناعم · تلاشي هادئ',
    emoji: '💕',
    slots: [
      photoSlot(3.5, 'fade'), photoSlot(3.5, 'fade'),
      videoSlot(4, 'fade'),   photoSlot(3.5, 'fade'),
      photoSlot(3.5, 'pan'),  videoSlot(4, 'fade'),
      photoSlot(3.5, 'fade'), photoSlot(3.5, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-emotional-11069.mp3',
    music_vibe: 'soft emotional piano',
    preview_color: '#E8B4C4',
  },
  {
    id: 'romantic_cinematic_strings',
    name_en: 'Romantic Cinematic',
    name_ar: 'رومانسي سينمائي',
    style: 'romantic', pacing: 'medium',
    description_en: 'Orchestral strings · dramatic',
    description_ar: 'أوركسترا · درامي',
    emoji: '🎻',
    slots: [
      photoSlot(3, 'fade'), videoSlot(4, 'zoom'),
      photoSlot(3, 'fade'), photoSlot(3, 'pan'),
      videoSlot(4, 'fade'), photoSlot(3, 'fade'),
      photoSlot(3, 'zoom'), videoSlot(4, 'fade'),
      photoSlot(3, 'fade'), photoSlot(3, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2024/02/08/audio_d2c1cdaaa9.mp3?filename=emotional-cinematic-string-194594.mp3',
    music_vibe: 'cinematic orchestral strings',
    preview_color: '#D4A5B8',
  },
  {
    id: 'romantic_dreamy',
    name_en: 'Dreamy Love',
    name_ar: 'حلم العشاق',
    style: 'romantic', pacing: 'slow',
    description_en: 'Lo-fi piano · dreamy zooms',
    description_ar: 'لوفي · تكبير هادئ',
    emoji: '✨',
    slots: [
      photoSlot(3, 'zoom'), photoSlot(3, 'fade'),
      videoSlot(4, 'fade'), photoSlot(3, 'pan'),
      photoSlot(3, 'zoom'), videoSlot(4, 'fade'),
      photoSlot(3, 'fade'), photoSlot(3, 'pan'),
      photoSlot(3, 'fade'), photoSlot(3, 'zoom'),
      videoSlot(4, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2023/06/23/audio_d2d99e5f0a.mp3?filename=falling-in-love-lofi-156585.mp3',
    music_vibe: 'dreamy lo-fi piano',
    preview_color: '#F0C5D6',
  },

  // ── HYPE / PARTY ──
  {
    id: 'hype_upbeat_pop',
    name_en: 'Party Hype',
    name_ar: 'حماس الحفلة',
    style: 'hype', pacing: 'fast',
    description_en: 'Upbeat pop · rapid cuts',
    description_ar: 'بوب سريع · قطع متتالي',
    emoji: '🎉',
    slots: [
      photoSlot(1.2, 'cut'), videoSlot(2, 'cut'),
      photoSlot(1.2, 'whip'), photoSlot(1.2, 'cut'),
      videoSlot(2, 'cut'), photoSlot(1.2, 'cut'),
      photoSlot(1.2, 'whip'), videoSlot(2, 'cut'),
      photoSlot(1.2, 'cut'), photoSlot(1.2, 'cut'),
      videoSlot(2, 'cut'), photoSlot(1.2, 'cut'),
      photoSlot(1.2, 'whip'), photoSlot(1.2, 'cut'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2023/01/15/audio_56497cbabe.mp3?filename=happy-celebration-138672.mp3',
    music_vibe: 'upbeat celebratory pop',
    preview_color: '#C8A2C8',
  },
  {
    id: 'hype_trap_beat',
    name_en: 'Trap Beat',
    name_ar: 'تراب',
    style: 'hype', pacing: 'fast',
    description_en: 'Trap beat · hard cuts · video heavy',
    description_ar: 'إيقاع تراب · فيديو',
    emoji: '🔥',
    slots: [
      photoSlot(1, 'cut'), videoSlot(2, 'cut'),
      videoSlot(2, 'cut'), photoSlot(1, 'whip'),
      videoSlot(2.5, 'cut'), photoSlot(1, 'cut'),
      videoSlot(2, 'cut'), photoSlot(1, 'cut'),
      videoSlot(2.5, 'cut'), photoSlot(1, 'whip'),
      videoSlot(2, 'cut'), photoSlot(1, 'cut'),
      videoSlot(2, 'cut'), photoSlot(1, 'cut'),
      videoSlot(2.5, 'cut'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_347111d654.mp3?filename=trap-future-bass-royalty-free-music-167020.mp3',
    music_vibe: 'energetic trap beat with bass drops',
    preview_color: '#9D7AB8',
  },
  {
    id: 'hype_edm_drop',
    name_en: 'EDM Drop',
    name_ar: 'موسيقى رقص',
    style: 'hype', pacing: 'fast',
    description_en: 'Electronic drop · beat sync',
    description_ar: 'إلكترونية · مزامنة',
    emoji: '🎵',
    slots: [
      photoSlot(2, 'fade'), photoSlot(2, 'zoom'),
      videoSlot(3, 'cut'), photoSlot(1.5, 'cut'),
      videoSlot(3, 'cut'), photoSlot(1.5, 'whip'),
      videoSlot(3, 'cut'), photoSlot(1.5, 'cut'),
      videoSlot(3, 'cut'), photoSlot(2, 'fade'),
      photoSlot(2, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bdd.mp3?filename=electronic-future-beats-117997.mp3',
    music_vibe: 'energetic EDM with beat drops',
    preview_color: '#7B89D9',
  },

  // ── FAMILY ──
  {
    id: 'family_acoustic',
    name_en: 'Family Warm',
    name_ar: 'دفء العائلة',
    style: 'family', pacing: 'medium',
    description_en: 'Acoustic guitar · gentle',
    description_ar: 'جيتار · لطيف',
    emoji: '👨‍👩‍👧',
    slots: [
      photoSlot(3, 'fade'), photoSlot(3, 'pan'),
      videoSlot(4, 'fade'), photoSlot(3, 'fade'),
      photoSlot(3, 'pan'), videoSlot(4, 'fade'),
      photoSlot(3, 'fade'), photoSlot(3, 'fade'),
      photoSlot(3, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2023/03/29/audio_e9bbc3aa30.mp3?filename=acoustic-mood-relaxing-acoustic-rock-139090.mp3',
    music_vibe: 'warm acoustic guitar',
    preview_color: '#D4B896',
  },
  {
    id: 'family_joyful_uplift',
    name_en: 'Joyful Family',
    name_ar: 'فرحة العائلة',
    style: 'family', pacing: 'medium',
    description_en: 'Uplifting acoustic · smooth',
    description_ar: 'موسيقى مفرحة',
    emoji: '☀️',
    slots: [
      photoSlot(2.5, 'fade'), photoSlot(2.5, 'pan'),
      videoSlot(3, 'fade'), photoSlot(2.5, 'fade'),
      photoSlot(2.5, 'slide'), videoSlot(3, 'fade'),
      photoSlot(2.5, 'pan'), photoSlot(2.5, 'fade'),
      videoSlot(3, 'slide'), photoSlot(2.5, 'fade'),
      photoSlot(2.5, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_15f5fe33fb.mp3?filename=just-relax-11157.mp3',
    music_vibe: 'happy uplifting acoustic',
    preview_color: '#E8C496',
  },

  // ── CINEMATIC ──
  {
    id: 'cinematic_dramatic',
    name_en: 'Cinematic Drama',
    name_ar: 'سينمائي درامي',
    style: 'cinematic', pacing: 'medium',
    description_en: 'Epic strings · widescreen feel',
    description_ar: 'وتريات ملحمية',
    emoji: '🎬',
    slots: [
      photoSlot(3.5, 'fade'), videoSlot(5, 'zoom'),
      photoSlot(3, 'pan'), photoSlot(3, 'zoom'),
      videoSlot(5, 'fade'), photoSlot(3, 'pan'),
      photoSlot(3, 'fade'), videoSlot(5, 'zoom'),
      photoSlot(3.5, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_dc116b1c11.mp3?filename=epic-emotional-cinematic-trailer-130663.mp3',
    music_vibe: 'epic dramatic cinematic',
    preview_color: '#3F5168',
  },
  {
    id: 'cinematic_modern',
    name_en: 'Modern Cinematic',
    name_ar: 'سينمائي عصري',
    style: 'cinematic', pacing: 'medium',
    description_en: 'Modern · sleek · video-rich',
    description_ar: 'سينمائي عصري · أنيق',
    emoji: '🎞️',
    slots: [
      photoSlot(3, 'zoom'), videoSlot(4, 'fade'),
      photoSlot(3, 'pan'), videoSlot(4, 'fade'),
      photoSlot(3, 'zoom'), photoSlot(3, 'pan'),
      videoSlot(4, 'fade'), photoSlot(3, 'fade'),
      videoSlot(4, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2024/06/04/audio_6cebc73abe.mp3?filename=cinematic-documentary-217419.mp3',
    music_vibe: 'modern cinematic documentary',
    preview_color: '#4A6580',
  },

  // ── AESTHETIC ──
  {
    id: 'aesthetic_soft_indie',
    name_en: 'Aesthetic Soft',
    name_ar: 'جمالي هادئ',
    style: 'aesthetic', pacing: 'medium',
    description_en: 'Soft indie · smooth flow',
    description_ar: 'إندي هادئ',
    emoji: '🌸',
    slots: [
      photoSlot(3, 'fade'), photoSlot(3, 'pan'),
      videoSlot(4, 'fade'), photoSlot(3, 'fade'),
      photoSlot(3, 'pan'), videoSlot(4, 'fade'),
      photoSlot(3, 'fade'), photoSlot(3, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_2c8a5ba8f2.mp3?filename=aesthetic-vlog-music-no-copyright-138359.mp3',
    music_vibe: 'soft aesthetic indie',
    preview_color: '#F2DCBC',
  },
  {
    id: 'aesthetic_vintage',
    name_en: 'Vintage Vibe',
    name_ar: 'حنين الماضي',
    style: 'aesthetic', pacing: 'slow',
    description_en: 'Vintage film · soft fades',
    description_ar: 'فيلم قديم',
    emoji: '🎞️',
    slots: [
      photoSlot(3.5, 'fade'), photoSlot(3.5, 'pan'),
      videoSlot(4, 'fade'), photoSlot(3.5, 'fade'),
      photoSlot(3.5, 'pan'), videoSlot(4, 'fade'),
      photoSlot(3.5, 'fade'), photoSlot(3.5, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/04/06/audio_5cd3a98b09.mp3?filename=vintage-jazz-saxophone-12320.mp3',
    music_vibe: 'vintage nostalgic jazz',
    preview_color: '#C9A876',
  },
  {
    id: 'aesthetic_minimal',
    name_en: 'Minimal Chic',
    name_ar: 'أنيق وبسيط',
    style: 'aesthetic', pacing: 'medium',
    description_en: 'Minimal · clean transitions',
    description_ar: 'بسيط وأنيق',
    emoji: '🤍',
    slots: [
      photoSlot(3, 'fade'), photoSlot(3, 'fade'),
      photoSlot(3, 'fade'), videoSlot(3, 'fade'),
      photoSlot(3, 'fade'), photoSlot(3, 'fade'),
      videoSlot(3, 'fade'), photoSlot(3, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668bff.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    music_vibe: 'minimal piano',
    preview_color: '#E8E1D9',
  },

  // ── TRENDY ──
  {
    id: 'trendy_reels_fast',
    name_en: 'Reels Trendy',
    name_ar: 'ريلز شائع',
    style: 'hype', pacing: 'fast',
    description_en: 'Trending fast cuts · video heavy',
    description_ar: 'قطع سريع · فيديو',
    emoji: '📱',
    slots: [
      photoSlot(1.2, 'cut'), videoSlot(2, 'cut'),
      photoSlot(1, 'whip'), videoSlot(2, 'cut'),
      photoSlot(1, 'cut'), videoSlot(2, 'cut'),
      photoSlot(1.2, 'whip'), videoSlot(2, 'cut'),
      photoSlot(1, 'cut'), videoSlot(2.5, 'cut'),
      photoSlot(1, 'cut'), photoSlot(1.2, 'cut'),
      videoSlot(2, 'cut'), photoSlot(1, 'cut'),
      photoSlot(1.2, 'whip'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2024/08/29/audio_2cffc16f1d.mp3?filename=summer-242415.mp3',
    music_vibe: 'trendy viral pop',
    preview_color: '#D69B9B',
  },

  // ── MEMORIES ──
  {
    id: 'memories_nostalgic',
    name_en: 'Memories',
    name_ar: 'ذكريات',
    style: 'romantic', pacing: 'slow',
    description_en: 'Nostalgic piano · slow story',
    description_ar: 'بيانو حنين',
    emoji: '🤍',
    slots: [
      photoSlot(4, 'fade'), videoSlot(5, 'fade'),
      photoSlot(4, 'fade'), photoSlot(4, 'fade'),
      videoSlot(5, 'fade'), photoSlot(4, 'fade'),
      photoSlot(4, 'fade'), photoSlot(4, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2024/05/12/audio_2c84094603.mp3?filename=relaxing-piano-209379.mp3',
    music_vibe: 'nostalgic emotional piano',
    preview_color: '#C5C5C5',
  },

  // ── HIGHLIGHT ──
  {
    id: 'highlight_reel',
    name_en: 'Highlight Reel',
    name_ar: 'أبرز اللحظات',
    style: 'hype', pacing: 'medium',
    description_en: 'Best moments · video mix',
    description_ar: 'أفضل اللحظات',
    emoji: '⭐',
    slots: [
      photoSlot(2, 'fade'), videoSlot(3, 'cut'),
      photoSlot(2, 'zoom'), videoSlot(3, 'cut'),
      photoSlot(2, 'fade'), videoSlot(3, 'cut'),
      photoSlot(2, 'zoom'), videoSlot(3, 'fade'),
      photoSlot(2, 'fade'), photoSlot(2, 'pan'),
      videoSlot(3, 'fade'),
    ],
    music_url: 'https://cdn.pixabay.com/download/audio/2024/03/13/audio_eedc9bb1c3.mp3?filename=happy-day-corporate-202172.mp3',
    music_vibe: 'energetic highlight reel',
    preview_color: '#F4C26F',
  },
]

export function getTemplate(id: string): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find(t => t.id === id)
}

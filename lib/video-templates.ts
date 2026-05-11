// lib/video-templates.ts
// 16 video templates for wedding/event recap videos.
// Each template defines: pacing, music URL, transitions, photo count.
// Audio: Pixabay royalty-free URLs (commercial use allowed, no attribution required).

export type TemplateStyle = 'romantic' | 'hype' | 'cinematic' | 'family' | 'aesthetic'
export type TemplatePacing = 'slow' | 'medium' | 'fast'

export interface VideoTemplate {
  id:           string
  name_en:      string
  name_ar:      string
  style:        TemplateStyle
  pacing:       TemplatePacing
  description_en: string
  description_ar: string
  emoji:        string
  photo_count:  number       // number of photo slots
  duration:     number       // total seconds
  music_url:    string       // royalty-free track
  music_vibe:   string       // for AI photo selection context
  transitions:  ('fade' | 'pan' | 'zoom' | 'slide' | 'whip' | 'cut')[]
  preview_color: string      // hex for the card UI
}

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // ── ROMANTIC ──
  {
    id: 'romantic_slow_piano',
    name_en: 'Romantic Slow',
    name_ar: 'رومانسي هادئ',
    style: 'romantic',
    pacing: 'slow',
    description_en: 'Soft piano · gentle fades',
    description_ar: 'بيانو ناعم · تلاشي هادئ',
    emoji: '💕',
    photo_count: 8,
    duration: 32,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-emotional-11069.mp3',
    music_vibe: 'soft emotional piano',
    transitions: ['fade', 'fade', 'pan'],
    preview_color: '#E8B4C4',
  },
  {
    id: 'romantic_cinematic_strings',
    name_en: 'Romantic Cinematic',
    name_ar: 'رومانسي سينمائي',
    style: 'romantic',
    pacing: 'medium',
    description_en: 'Orchestral strings · dramatic',
    description_ar: 'أوركسترا · درامي',
    emoji: '🎻',
    photo_count: 10,
    duration: 35,
    music_url: 'https://cdn.pixabay.com/download/audio/2024/02/08/audio_d2c1cdaaa9.mp3?filename=emotional-cinematic-string-194594.mp3',
    music_vibe: 'cinematic orchestral strings',
    transitions: ['fade', 'zoom', 'pan'],
    preview_color: '#D4A5B8',
  },
  {
    id: 'romantic_dreamy',
    name_en: 'Dreamy Love',
    name_ar: 'حلم العشاق',
    style: 'romantic',
    pacing: 'slow',
    description_en: 'Lo-fi piano · dreamy zooms',
    description_ar: 'لوفي · تكبير هادئ',
    emoji: '✨',
    photo_count: 12,
    duration: 36,
    music_url: 'https://cdn.pixabay.com/download/audio/2023/06/23/audio_d2d99e5f0a.mp3?filename=falling-in-love-lofi-156585.mp3',
    music_vibe: 'dreamy lo-fi piano',
    transitions: ['zoom', 'fade', 'pan'],
    preview_color: '#F0C5D6',
  },

  // ── HYPE / PARTY ──
  {
    id: 'hype_upbeat_pop',
    name_en: 'Party Hype',
    name_ar: 'حماس الحفلة',
    style: 'hype',
    pacing: 'fast',
    description_en: 'Upbeat pop · rapid cuts',
    description_ar: 'بوب سريع · قطع متتالي',
    emoji: '🎉',
    photo_count: 14,
    duration: 21,
    music_url: 'https://cdn.pixabay.com/download/audio/2023/01/15/audio_56497cbabe.mp3?filename=happy-celebration-138672.mp3',
    music_vibe: 'upbeat celebratory pop',
    transitions: ['cut', 'whip', 'slide'],
    preview_color: '#C8A2C8',
  },
  {
    id: 'hype_trap_beat',
    name_en: 'Trap Beat',
    name_ar: 'ترَاب',
    style: 'hype',
    pacing: 'fast',
    description_en: 'Trap beat · hard cuts',
    description_ar: 'إيقاع تراب · قطع قوي',
    emoji: '🔥',
    photo_count: 16,
    duration: 24,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_347111d654.mp3?filename=trap-future-bass-royalty-free-music-167020.mp3',
    music_vibe: 'energetic trap beat with bass drops',
    transitions: ['cut', 'whip'],
    preview_color: '#9D7AB8',
  },
  {
    id: 'hype_edm_drop',
    name_en: 'EDM Drop',
    name_ar: 'موسيقى رقص',
    style: 'hype',
    pacing: 'fast',
    description_en: 'Electronic drop · beat sync',
    description_ar: 'إلكترونية · مزامنة الإيقاع',
    emoji: '🎵',
    photo_count: 12,
    duration: 30,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bdd.mp3?filename=electronic-future-beats-117997.mp3',
    music_vibe: 'energetic EDM with beat drops',
    transitions: ['cut', 'zoom', 'slide'],
    preview_color: '#7B89D9',
  },

  // ── FAMILY / WARM ──
  {
    id: 'family_acoustic',
    name_en: 'Family Warm',
    name_ar: 'دفء العائلة',
    style: 'family',
    pacing: 'medium',
    description_en: 'Acoustic guitar · gentle',
    description_ar: 'جيتار · لطيف',
    emoji: '👨‍👩‍👧',
    photo_count: 10,
    duration: 30,
    music_url: 'https://cdn.pixabay.com/download/audio/2023/03/29/audio_e9bbc3aa30.mp3?filename=acoustic-mood-relaxing-acoustic-rock-139090.mp3',
    music_vibe: 'warm acoustic guitar, family vibe',
    transitions: ['fade', 'pan'],
    preview_color: '#D4B896',
  },
  {
    id: 'family_joyful_uplift',
    name_en: 'Joyful Family',
    name_ar: 'فرحة العائلة',
    style: 'family',
    pacing: 'medium',
    description_en: 'Uplifting acoustic · smooth',
    description_ar: 'موسيقى مفرحة',
    emoji: '☀️',
    photo_count: 12,
    duration: 30,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_15f5fe33fb.mp3?filename=just-relax-11157.mp3',
    music_vibe: 'happy uplifting acoustic',
    transitions: ['fade', 'slide', 'pan'],
    preview_color: '#E8C496',
  },

  // ── CINEMATIC ──
  {
    id: 'cinematic_dramatic',
    name_en: 'Cinematic Drama',
    name_ar: 'سينمائي درامي',
    style: 'cinematic',
    pacing: 'medium',
    description_en: 'Epic strings · widescreen',
    description_ar: 'وتريات ملحمية',
    emoji: '🎬',
    photo_count: 10,
    duration: 35,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_dc116b1c11.mp3?filename=epic-emotional-cinematic-trailer-130663.mp3',
    music_vibe: 'epic dramatic cinematic',
    transitions: ['fade', 'zoom', 'pan'],
    preview_color: '#3F5168',
  },
  {
    id: 'cinematic_modern',
    name_en: 'Modern Cinematic',
    name_ar: 'سينمائي عصري',
    style: 'cinematic',
    pacing: 'medium',
    description_en: 'Modern cinematic · sleek',
    description_ar: 'سينمائي عصري · أنيق',
    emoji: '🎞️',
    photo_count: 11,
    duration: 33,
    music_url: 'https://cdn.pixabay.com/download/audio/2024/06/04/audio_6cebc73abe.mp3?filename=cinematic-documentary-217419.mp3',
    music_vibe: 'modern cinematic documentary',
    transitions: ['zoom', 'pan', 'fade'],
    preview_color: '#4A6580',
  },

  // ── AESTHETIC / TRENDY ──
  {
    id: 'aesthetic_soft_indie',
    name_en: 'Aesthetic Soft',
    name_ar: 'جمالي هادئ',
    style: 'aesthetic',
    pacing: 'medium',
    description_en: 'Soft indie · smooth flow',
    description_ar: 'إندي هادئ',
    emoji: '🌸',
    photo_count: 9,
    duration: 27,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_2c8a5ba8f2.mp3?filename=aesthetic-vlog-music-no-copyright-138359.mp3',
    music_vibe: 'soft aesthetic indie',
    transitions: ['fade', 'pan'],
    preview_color: '#F2DCBC',
  },
  {
    id: 'aesthetic_vintage',
    name_en: 'Vintage Vibe',
    name_ar: 'حنين الماضي',
    style: 'aesthetic',
    pacing: 'slow',
    description_en: 'Vintage film · soft fades',
    description_ar: 'فيلم قديم',
    emoji: '🎞️',
    photo_count: 10,
    duration: 30,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/04/06/audio_5cd3a98b09.mp3?filename=vintage-jazz-saxophone-12320.mp3',
    music_vibe: 'vintage nostalgic jazz',
    transitions: ['fade', 'pan'],
    preview_color: '#C9A876',
  },
  {
    id: 'aesthetic_minimal',
    name_en: 'Minimal Chic',
    name_ar: 'أنيق وبسيط',
    style: 'aesthetic',
    pacing: 'medium',
    description_en: 'Minimal · clean transitions',
    description_ar: 'بسيط وأنيق',
    emoji: '🤍',
    photo_count: 8,
    duration: 24,
    music_url: 'https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668bff.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    music_vibe: 'minimal piano',
    transitions: ['fade'],
    preview_color: '#E8E1D9',
  },

  // ── TRENDY SOCIAL ──
  {
    id: 'trendy_reels_fast',
    name_en: 'Reels Trendy',
    name_ar: 'ريلز شائع',
    style: 'hype',
    pacing: 'fast',
    description_en: 'Trending fast cuts · viral feel',
    description_ar: 'قطع سريع · فيرال',
    emoji: '📱',
    photo_count: 15,
    duration: 30,
    music_url: 'https://cdn.pixabay.com/download/audio/2024/08/29/audio_2cffc16f1d.mp3?filename=summer-242415.mp3',
    music_vibe: 'trendy viral pop',
    transitions: ['whip', 'cut', 'zoom'],
    preview_color: '#D69B9B',
  },

  // ── MEMORIES / NOSTALGIC ──
  {
    id: 'memories_nostalgic',
    name_en: 'Memories',
    name_ar: 'ذكريات',
    style: 'romantic',
    pacing: 'slow',
    description_en: 'Nostalgic piano · slow story',
    description_ar: 'بيانو حنين',
    emoji: '🤍',
    photo_count: 8,
    duration: 32,
    music_url: 'https://cdn.pixabay.com/download/audio/2024/05/12/audio_2c84094603.mp3?filename=relaxing-piano-209379.mp3',
    music_vibe: 'nostalgic emotional piano',
    transitions: ['fade'],
    preview_color: '#C5C5C5',
  },
  {
    id: 'highlight_reel',
    name_en: 'Highlight Reel',
    name_ar: 'أبرز اللحظات',
    style: 'hype',
    pacing: 'medium',
    description_en: 'Best moments · energy flow',
    description_ar: 'أفضل اللحظات',
    emoji: '⭐',
    photo_count: 12,
    duration: 30,
    music_url: 'https://cdn.pixabay.com/download/audio/2024/03/13/audio_eedc9bb1c3.mp3?filename=happy-day-corporate-202172.mp3',
    music_vibe: 'energetic highlight reel',
    transitions: ['cut', 'zoom', 'fade'],
    preview_color: '#F4C26F',
  },
]

export function getTemplate(id: string): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByStyle(style: TemplateStyle): VideoTemplate[] {
  return VIDEO_TEMPLATES.filter(t => t.style === style)
}

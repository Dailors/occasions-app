// lib/templates/index.ts
// The three core cinematic templates.
// Templates are blueprints only — no video data, just structure.

import type { VideoTemplate } from '@/types'

export const TEMPLATES: Record<string, VideoTemplate> = {

  romantic_01: {
    template_id:  'romantic_01',
    name:         'Romantic Cinematic',
    description:  'A soft, emotional wedding highlight built around the couple.',
    duration:     40,
    aspect_ratio: '9:16',
    music_style:  'soft_emotional',
    segments: [
      { start: 0,  end: 4,  requirement: 'venue_wide',       media_type: 'photo_or_video', transition: 'fade' },
      { start: 4,  end: 10, requirement: 'couple_best',       media_type: 'photo',          transition: 'dissolve' },
      { start: 10, end: 16, requirement: 'ceremony_emotion',  media_type: 'video_priority', transition: 'fade' },
      { start: 16, end: 22, requirement: 'intimate_couple',   media_type: 'photo' },
      { start: 22, end: 28, requirement: 'family_group',      media_type: 'photo_or_video', transition: 'dissolve' },
      { start: 28, end: 34, requirement: 'candid_moment',     media_type: 'photo_or_video' },
      { start: 34, end: 40, requirement: 'emotional_close',   media_type: 'photo',          transition: 'fade', text_overlay: 'Forever starts here' },
    ],
    thumbnail: '/templates/romantic_01.jpg',
  },

  party_reel_01: {
    template_id:  'party_reel_01',
    name:         'High-Energy Party Reel',
    description:  'Fast-cut, energetic reel built for the reception dance floor.',
    duration:     30,
    aspect_ratio: '9:16',
    music_style:  'upbeat_party',
    segments: [
      { start: 0,  end: 3,  requirement: 'entrance',          media_type: 'video_priority', transition: 'cut' },
      { start: 3,  end: 7,  requirement: 'dance_energy',      media_type: 'video_priority', transition: 'cut' },
      { start: 7,  end: 10, requirement: 'reception_party',   media_type: 'video_priority', transition: 'cut' },
      { start: 10, end: 14, requirement: 'couple_best',       media_type: 'photo_or_video', transition: 'zoom' },
      { start: 14, end: 18, requirement: 'dance_energy',      media_type: 'video_priority', transition: 'cut' },
      { start: 18, end: 22, requirement: 'family_group',      media_type: 'photo_or_video', transition: 'cut' },
      { start: 22, end: 26, requirement: 'reception_party',   media_type: 'video_priority', transition: 'cut' },
      { start: 26, end: 30, requirement: 'couple_best',       media_type: 'photo',          transition: 'fade', text_overlay: 'Best night ever 🎉' },
    ],
    thumbnail: '/templates/party_reel_01.jpg',
  },

  family_recap_01: {
    template_id:  'family_recap_01',
    name:         'Emotional Family Recap',
    description:  'A heartfelt recap focusing on family moments and the full day.',
    duration:     50,
    aspect_ratio: '9:16',
    music_style:  'warm_acoustic',
    segments: [
      { start: 0,  end: 5,  requirement: 'venue_wide',        media_type: 'photo_or_video', transition: 'fade' },
      { start: 5,  end: 11, requirement: 'family_group',      media_type: 'photo',          transition: 'dissolve' },
      { start: 11, end: 17, requirement: 'ceremony_emotion',  media_type: 'video_priority', transition: 'fade' },
      { start: 17, end: 22, requirement: 'couple_best',       media_type: 'photo' },
      { start: 22, end: 28, requirement: 'candid_moment',     media_type: 'photo_or_video', transition: 'dissolve' },
      { start: 28, end: 34, requirement: 'family_group',      media_type: 'photo_or_video' },
      { start: 34, end: 40, requirement: 'dance_energy',      media_type: 'video_priority', transition: 'cut' },
      { start: 40, end: 46, requirement: 'emotional_close',   media_type: 'photo',          transition: 'dissolve' },
      { start: 46, end: 50, requirement: 'couple_best',       media_type: 'photo',          transition: 'fade', text_overlay: 'Family. Forever. Love.' },
    ],
    thumbnail: '/templates/family_recap_01.jpg',
  },
}

export const TEMPLATE_LIST = Object.values(TEMPLATES)

export function getTemplate(id: string): VideoTemplate | null {
  return TEMPLATES[id] ?? null
}

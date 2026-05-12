// lib/creatomate-builder.ts
// Builds Creatomate render source JSON. Supports both photo AND video slots.

import type { VideoTemplate, MediaSlot, Transition } from './video-templates'

export interface MediaItem {
  type: 'photo' | 'video'
  url: string             // signed URL to the file
}

interface BuilderInput {
  template:   VideoTemplate
  media:      MediaItem[]      // ordered list matching the slot sequence
  title_text?: string
  subtitle?:   string
}

const ANIMATIONS: Record<Transition, (duration: number) => any[]> = {
  fade: (d) => [
    { time: 'start', duration: 0.4, transition: true, type: 'fade' },
    { time: 'end',   duration: 0.4, transition: true, type: 'fade' },
  ],
  zoom: (d) => [
    { time: 'start', duration: 0.4, transition: true, type: 'fade' },
    { time: 'start', duration: d,   easing: 'linear', type: 'scale', scope: 'element', start_scale: '115%', end_scale: '100%' },
    { time: 'end',   duration: 0.4, transition: true, type: 'fade' },
  ],
  pan: (d) => [
    { time: 'start', duration: 0.4, transition: true, type: 'fade' },
    { time: 'start', duration: d,   easing: 'linear', type: 'pan',   scope: 'element', start_x: '-3%', end_x: '3%' },
    { time: 'end',   duration: 0.4, transition: true, type: 'fade' },
  ],
  slide: (d) => [
    { time: 'start', duration: 0.3, transition: true, type: 'slide', direction: '0°' },
    { time: 'end',   duration: 0.3, transition: true, type: 'slide', direction: '180°' },
  ],
  whip: (d) => [
    { time: 'start', duration: 0.15, transition: true, type: 'whip-pan', direction: '0°' },
    { time: 'end',   duration: 0.15, transition: true, type: 'whip-pan', direction: '0°' },
  ],
  cut: () => [],
}

export function buildCreatomateSource(input: BuilderInput) {
  const { template, media, title_text, subtitle } = input
  const slots = template.slots
  const used = media.slice(0, slots.length)
  if (used.length === 0) throw new Error('No media provided')

  const hasTitle = !!title_text
  const titleDuration = hasTitle ? 2.5 : 0

  // Total duration based on slots
  const slotsTotal = slots.slice(0, used.length).reduce((s, slot) => s + slot.duration, 0)
  const totalDuration = titleDuration + slotsTotal

  const elements: any[] = []

  // 1. Background music
  elements.push({
    type: 'audio',
    track: 100,
    source: template.music_url,
    time: 0,
    duration: totalDuration,
    audio_fade_in: 0.5,
    audio_fade_out: 1.0,
  })

  // 2. Title overlay
  if (hasTitle) {
    elements.push({
      type: 'composition',
      track: 2,
      time: 0,
      duration: titleDuration,
      animations: [
        { time: 'start', duration: 0.6, transition: true, type: 'fade' },
        { time: 'end',   duration: 0.6, transition: true, type: 'fade' },
      ],
      elements: [
        {
          type: 'rectangle',
          fill_color: 'rgba(13,27,42,0.55)',
          width: '100%', height: '100%',
        },
        {
          type: 'text',
          time: 0,
          duration: titleDuration,
          width: '85%',
          y: '46%',
          font_family: 'Playfair Display',
          font_weight: '600',
          font_size: '7.5vmin',
          fill_color: '#FDFAF6',
          text_align: 'center',
          text: title_text,
        },
        ...(subtitle ? [{
          type: 'text',
          time: 0,
          duration: titleDuration,
          width: '85%',
          y: '60%',
          font_family: 'Inter',
          font_weight: '400',
          font_size: '3vmin',
          fill_color: '#C4914A',
          text_align: 'center',
          text: subtitle,
        }] : []),
      ],
    })
  }

  // 3. Sequence of media (photo or video clip)
  let cursor = titleDuration
  used.forEach((item, i) => {
    const slot = slots[i]
    const dur = slot.duration
    const animations = ANIMATIONS[slot.transition](dur)

    elements.push({
      type: item.type === 'video' ? 'video' : 'image',
      track: 1,
      time: cursor,
      duration: dur,
      // For videos, trim to slot duration starting from a small offset
      ...(item.type === 'video' ? {
        trim_start: 0.5,         // skip first half second (often a still frame)
        trim_duration: dur,
        muted: true,             // template music plays, mute clip audio
      } : {}),
      source: item.url,
      fit: 'cover',
      x: '50%',
      y: '50%',
      width: '100%',
      height: '100%',
      animations,
    })
    cursor += dur
  })

  // 4. Brand watermark (subtle)
  elements.push({
    type: 'text',
    track: 50,
    time: 0.5,
    duration: totalDuration - 0.5,
    text: 'Munasaba',
    font_family: 'Inter',
    font_weight: '600',
    font_size: '2vmin',
    fill_color: 'rgba(253,250,246,0.7)',
    x: '90%',
    y: '95%',
    text_align: 'right',
  })

  return {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    frame_rate: 30,
    duration: totalDuration,
    elements,
  }
}

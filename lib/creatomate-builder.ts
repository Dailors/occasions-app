// lib/creatomate-builder.ts
// Builds Creatomate render source JSON from our template + selected photos.
// Outputs vertical 1080x1920 MP4 ready for Reels/TikTok/Stories.

import type { VideoTemplate } from './video-templates'

interface BuilderInput {
  template:     VideoTemplate
  photo_urls:   string[]         // public/signed URLs to photos
  title_text?:  string           // couple names overlay
  subtitle?:    string           // event date overlay
}

// Animation presets — Creatomate supports these out of the box
const ANIMATIONS = {
  fade:  [
    { time: 'start', duration: 0.4, transition: true, type: 'fade' },
    { time: 'end',   duration: 0.4, transition: true, type: 'fade' },
  ],
  zoom: [
    { time: 'start', duration: 0.4, transition: true, type: 'fade' },
    { time: 'start', duration: 4,   easing: 'linear', type: 'scale', scope: 'element', start_scale: '120%', end_scale: '100%' },
    { time: 'end',   duration: 0.4, transition: true, type: 'fade' },
  ],
  pan: [
    { time: 'start', duration: 0.4, transition: true, type: 'fade' },
    { time: 'start', duration: 4,   easing: 'linear', type: 'pan',   scope: 'element', start_x: '-3%', end_x: '3%' },
    { time: 'end',   duration: 0.4, transition: true, type: 'fade' },
  ],
  slide: [
    { time: 'start', duration: 0.3, transition: true, type: 'slide', direction: '0°' },
    { time: 'end',   duration: 0.3, transition: true, type: 'slide', direction: '180°' },
  ],
  whip: [
    { time: 'start', duration: 0.15, transition: true, type: 'whip-pan', direction: '0°' },
    { time: 'end',   duration: 0.15, transition: true, type: 'whip-pan', direction: '0°' },
  ],
  cut: [], // no animation, hard cut
}

export function buildCreatomateSource(input: BuilderInput) {
  const { template, photo_urls, title_text, subtitle } = input
  const photos = photo_urls.slice(0, template.photo_count)
  if (photos.length === 0) throw new Error('No photos provided')

  // Calculate per-photo duration (accounting for optional title at start)
  const hasTitle = !!title_text
  const titleDuration = hasTitle ? 2.5 : 0
  const photoTotalTime = template.duration - titleDuration
  const perPhoto = photoTotalTime / photos.length

  const elements: any[] = []

  // 1. Background music — full duration
  elements.push({
    type: 'audio',
    track: 100,
    source: template.music_url,
    time: 0,
    duration: template.duration,
    audio_fade_in: 0.5,
    audio_fade_out: 1.0,
  })

  // 2. Title overlay at start (if provided)
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
          fill_color: 'rgba(0,0,0,0.5)',
          width: '100%', height: '100%',
        },
        {
          type: 'text',
          time: 0,
          duration: titleDuration,
          width: '85%',
          y: '45%',
          font_family: 'Playfair Display',
          font_weight: '700',
          font_size: '7vmin',
          fill_color: '#FFFFFF',
          text_align: 'center',
          text: title_text,
        },
        ...(subtitle ? [{
          type: 'text',
          time: 0,
          duration: titleDuration,
          width: '85%',
          y: '58%',
          font_family: 'Inter',
          font_weight: '500',
          font_size: '3vmin',
          fill_color: '#C4B49A',
          text_align: 'center',
          text: subtitle,
        }] : []),
      ],
    })
  }

  // 3. Photos — cycle through transitions
  photos.forEach((url, i) => {
    const transition = template.transitions[i % template.transitions.length]
    const animationsBase = ANIMATIONS[transition] ?? ANIMATIONS.fade

    // Customize animation duration to actual photo duration
    const animations = animationsBase.map((a: any) => {
      if (a.type === 'scale' || a.type === 'pan') {
        return { ...a, duration: perPhoto }
      }
      return a
    })

    elements.push({
      type: 'image',
      track: 1,
      time: titleDuration + i * perPhoto,
      duration: perPhoto,
      source: url,
      fit: 'cover',
      x: '50%',
      y: '50%',
      width: '100%',
      height: '100%',
      animations,
    })
  })

  // 4. Subtle brand watermark in corner
  elements.push({
    type: 'text',
    track: 50,
    time: 0.5,
    duration: template.duration - 0.5,
    text: 'Occasions',
    font_family: 'Inter',
    font_weight: '600',
    font_size: '2vmin',
    fill_color: 'rgba(255,255,255,0.7)',
    x: '90%',
    y: '95%',
    text_align: 'right',
  })

  return {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    frame_rate: 30,
    duration: template.duration,
    elements,
  }
}

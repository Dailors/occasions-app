// app/manifest.ts
// Web App Manifest — enables "Add to Home Screen" on mobile.
// Critical for MENA WhatsApp-first usage patterns.

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Occasions — Wedding Memories',
    short_name:       'Occasions',
    description:      'Share your wedding photos and videos privately.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#ffffff',
    theme_color:      '#d95a30',
    orientation:      'portrait',
    icons: [
      {
        src:   '/icon-192.png',
        sizes: '192x192',
        type:  'image/png',
      },
      {
        src:   '/icon-512.png',
        sizes: '512x512',
        type:  'image/png',
      },
      {
        src:     '/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}

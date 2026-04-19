// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Playfair_Display } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'Occasions — Wedding Memory Platform',
  description: 'Private wedding media collection and cinematic video generation.',
  manifest:    '/manifest.webmanifest',
  appleWebApp: {
    capable:          true,
    statusBarStyle:   'default',
    title:            'Occasions',
  },
  viewport: {
    width:         'device-width',
    initialScale:  1,
    maximumScale:  1,
    userScalable:  false,
  },
  themeColor: '#d95a30',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background:   '#1a1a1a',
              color:        '#fff',
              fontSize:     '14px',
            },
          }}
        />
      </body>
    </html>
  )
}

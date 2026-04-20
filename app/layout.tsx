import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { I18nProvider } from '@/lib/i18n'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })

export const metadata: Metadata = {
  title: 'Occasions — Private Event Memories',
  description: 'Collect and relive your most precious moments privately.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Occasions' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#22303f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <I18nProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: { borderRadius: '12px', background: '#22303f', color: '#fff', fontSize: '14px' },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  )
}

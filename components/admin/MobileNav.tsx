// components/admin/MobileNav.tsx
// Bottom navigation bar shown on mobile (< md breakpoint).
// Mirrors the sidebar nav for event pages.

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ImageIcon, Video,
  Settings, QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LiveCounter } from './LiveCounter'

interface MobileNavProps {
  eventId: string
}

export function MobileNav({ eventId }: MobileNavProps) {
  const pathname = usePathname()

  const items = [
    { href: `/dashboard/${eventId}`,          icon: LayoutDashboard, label: 'Overview' },
    { href: `/dashboard/${eventId}/media`,    icon: ImageIcon,       label: 'Media',   counter: true },
    { href: `/dashboard/${eventId}/videos`,   icon: Video,           label: 'Videos'   },
    { href: `/dashboard/${eventId}/qr`,       icon: QrCode,          label: 'QR'       },
    { href: `/dashboard/${eventId}/settings`, icon: Settings,        label: 'Settings' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-stretch">
        {items.map(({ href, icon: Icon, label, counter }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-700'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {counter && (
                  <span className="absolute -top-1.5 -right-1.5">
                    <LiveCounter />
                  </span>
                )}
              </div>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

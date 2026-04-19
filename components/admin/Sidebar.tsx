// components/admin/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarHeart, ImageIcon,
  Video, Settings, LogOut, Sparkles, QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LiveCounter } from './LiveCounter'

const NAV = [
  { href: '/dashboard',      icon: LayoutDashboard, label: 'Events'    },
  { href: '/dashboard/new',  icon: CalendarHeart,   label: 'New Event' },
]

const EVENT_NAV = (id: string) => [
  { href: `/dashboard/${id}`,          icon: LayoutDashboard, label: 'Overview', counter: false },
  { href: `/dashboard/${id}/media`,    icon: ImageIcon,       label: 'Media',    counter: true  },
  { href: `/dashboard/${id}/videos`,   icon: Video,           label: 'Videos',   counter: false },
  { href: `/dashboard/${id}/qr`,       icon: QrCode,          label: 'Print QR', counter: false },
  { href: `/dashboard/${id}/settings`, icon: Settings,        label: 'Settings', counter: false },
]

interface SidebarProps {
  eventId?: string
}

export function Sidebar({ eventId }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = eventId ? EVENT_NAV(eventId) : NAV

  return (
    <aside className="w-60 flex-shrink-0 h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-lg font-semibold text-gray-900">Occasions</span>
        </Link>
      </div>

      {/* Back to events */}
      {eventId && (
        <div className="px-3 pt-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← All events
          </Link>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label, counter }: any) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {counter && <LiveCounter />}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

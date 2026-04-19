// app/dashboard/[eventId]/layout.tsx
import { Sidebar } from '@/components/admin/Sidebar'
import { MobileNav } from '@/components/admin/MobileNav'
import { EventDataProvider } from '@/components/admin/EventDataProvider'

interface Props {
  children: React.ReactNode
  params:   { eventId: string }
}

export default function EventLayout({ children, params }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar eventId={params.eventId} />
      </div>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <EventDataProvider eventId={params.eventId}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
            {children}
          </div>
        </EventDataProvider>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav eventId={params.eventId} />
    </div>
  )
}


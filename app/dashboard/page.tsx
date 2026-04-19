import { createServerClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/admin/EventCard'
import { Sidebar } from '@/components/admin/Sidebar'
import { Button } from '@/components/ui/Button'
import { Plus, CalendarX } from 'lucide-react'
import Link from 'next/link'
import type { EventSummary } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: events }, { data: profile }] = await Promise.all([
    supabase.from('event_summary').select('*').order('wedding_date', { ascending: true }),
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
  ])

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col gap-8">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-gray-900">
                  Welcome back{firstName ? `, ${firstName}` : ''}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {(events ?? []).length === 0
                    ? 'Create your first wedding event to get started.'
                    : `You have ${(events ?? []).length} event${(events ?? []).length !== 1 ? 's' : ''}.`}
                </p>
              </div>
              <Link href="/dashboard/new">
                <Button size="md" className="gap-2 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                  New event
                </Button>
              </Link>
            </div>

            {(events ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <CalendarX className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">No events yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create a wedding event to start collecting memories.
                  </p>
                </div>
                <Link href="/dashboard/new">
                  <Button size="md" className="mt-2 gap-2">
                    <Plus className="w-4 h-4" />
                    Create first event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(events as EventSummary[]).map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

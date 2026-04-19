export const dynamic = 'force-dynamic'

// app/dashboard/new/page.tsx
import { Sidebar } from '@/components/admin/Sidebar'
import { CreateEventForm } from '@/components/admin/CreateEventForm'

export default function NewEventPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-gray-900">New wedding event</h1>
              <p className="text-sm text-gray-500 mt-1">
                Three albums (mixed, men, women) will be created automatically with unique upload links.
              </p>
            </div>
            <CreateEventForm />
          </div>
        </div>
      </main>
    </div>
  )
}

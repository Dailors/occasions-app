// app/dashboard/[eventId]/settings/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEventStore } from '@/lib/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AlbumCard } from '@/components/admin/AlbumCard'
import { Badge } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Settings, Users, Trash2, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { eventId }         = useParams<{ eventId: string }>()
  const router              = useRouter()
  const loading             = useEventStore(s => s.loading)
  const storeEvent          = useEventStore(s => s.event)
  const albums              = useEventStore(s => s.albums)
  const guests              = useEventStore(s => s.guests)
  const setData             = useEventStore(s => s.setData)

  const [saving,   setSave] = useState(false)
  const [deleting, setDel]  = useState(false)
  const [form, setForm]     = useState({
    couple_names: '',
    wedding_date: '',
    location:     '',
    status:       'active',
  })

  // Sync local form from store once loaded
  useEffect(() => {
    if (storeEvent) {
      setForm(f => ({
        ...f,
        couple_names: storeEvent.couple_names ?? '',
        wedding_date: storeEvent.wedding_date ?? '',
        status:       storeEvent.status       ?? 'active',
      }))
    }
  }, [storeEvent])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSave(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      // Optimistically update store
      if (storeEvent) setData({ event: { ...storeEvent, ...form } as any })
      toast.success('Settings saved')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSave(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('Close this event? Guests will no longer be able to upload.')) return
    await fetch(`/api/events/${eventId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'closed' }),
    })
    setForm(f => ({ ...f, status: 'closed' }))
    if (storeEvent) setData({ event: { ...storeEvent, status: 'closed' } as any })
    toast.success('Event closed')
  }

  const handleDelete = async () => {
    if (!confirm('Delete this event permanently? All media, albums, and videos will be lost. This cannot be undone.')) return
    setDel(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Event deleted')
      router.push('/dashboard')
    } catch {
      toast.error('Could not delete event')
    } finally {
      setDel(false)
    }
  }

  if (loading && !storeEvent) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Skeleton className="h-8 w-32" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-400" />
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Event details */}
      <Card>
        <h2 className="font-medium text-gray-900 mb-4">Event details</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            id="couple_names"
            label="Couple names"
            value={form.couple_names}
            onChange={e => setForm(f => ({ ...f, couple_names: e.target.value }))}
          />
          <Input
            id="wedding_date"
            label="Wedding date"
            type="date"
            value={form.wedding_date}
            onChange={e => setForm(f => ({ ...f, wedding_date: e.target.value }))}
          />
          <Input
            id="location"
            label="Location"
            placeholder="Dubai, UAE"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          />
          <div className="flex items-center justify-between pt-1">
            <Badge color={form.status === 'active' ? 'green' : 'gray'}>{form.status}</Badge>
            <Button type="submit" loading={saving} size="sm">Save changes</Button>
          </div>
        </form>
      </Card>

      {/* Albums */}
      <Card>
        <h2 className="font-medium text-gray-900 mb-4">Upload links</h2>
        <div className="flex flex-col gap-3">
          {albums.map(album => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </Card>

      {/* Guests */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="font-medium text-gray-900">Guests ({guests.length})</h2>
        </div>
        {guests.length === 0 ? (
          <p className="text-sm text-gray-400">No guests have uploaded yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {guests.map(g => (
              <div key={g.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {(g.profiles as any)?.full_name ?? 'Anonymous guest'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined {formatDate(g.joined_at, 'dd MMM yyyy · HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Danger zone */}
      <Card className="border-red-100">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="font-medium text-red-600">Danger zone</h2>
        </div>
        <div className="flex flex-col gap-3">
          {form.status === 'active' && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Close event</p>
                <p className="text-xs text-gray-500">Guests can no longer upload. You keep all media.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleClose}>Close event</Button>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div>
              <p className="text-sm font-medium text-red-600">Delete event</p>
              <p className="text-xs text-gray-500">Permanently deletes all media, albums, and videos.</p>
            </div>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

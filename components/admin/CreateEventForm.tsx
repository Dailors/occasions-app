// components/admin/CreateEventForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CalendarHeart } from 'lucide-react'
import toast from 'react-hot-toast'

export function CreateEventForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    couple_names: '',
    wedding_date: '',
    location:     '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.couple_names.trim()) {
      toast.error('Couple names are required')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Event created!')
      router.push(`/dashboard/${data.event.id}`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <CalendarHeart className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">New Wedding Event</h2>
          <p className="text-sm text-gray-500">3 albums will be created automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="couple_names"
          label="Couple names *"
          placeholder="Sara & Ali"
          value={form.couple_names}
          onChange={e => setForm(f => ({ ...f, couple_names: e.target.value }))}
          required
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
          label="Location (optional)"
          placeholder="Dubai, UAE"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
        />

        <Button type="submit" loading={loading} size="lg" className="mt-2">
          Create event
        </Button>
      </form>
    </Card>
  )
}

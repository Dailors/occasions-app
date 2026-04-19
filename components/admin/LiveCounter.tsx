// components/admin/LiveCounter.tsx
// Tiny badge that shows the live media count next to the "Media" nav link.
// Uses the Zustand store — updates in real-time as guests upload.

'use client'
import { useEventStore } from '@/lib/store'

export function LiveCounter() {
  const count = useEventStore(s => s.media.length)
  if (count === 0) return null
  return (
    <span className="ml-auto bg-brand-100 text-brand-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {count > 999 ? '999+' : count}
    </span>
  )
}

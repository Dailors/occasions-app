// app/dashboard/[eventId]/settings/loading.tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <Skeleton className="h-7 w-28" />
      {[0,1,2].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ))}
    </div>
  )
}

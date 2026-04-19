// app/dashboard/[eventId]/loading.tsx
import { StatsSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function EventLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>
      <StatsSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0,1,2].map(i => <Skeleton key={i} className="h-32" rounded="lg" />)}
      </div>
    </div>
  )
}

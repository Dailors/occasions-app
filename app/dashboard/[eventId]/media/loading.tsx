// app/dashboard/[eventId]/media/loading.tsx
import { MediaGridSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function MediaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36" rounded="lg" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-44" rounded="lg" />
        <Skeleton className="h-10 w-40" rounded="lg" />
        <Skeleton className="h-10 w-40" rounded="lg" />
      </div>
      <MediaGridSkeleton count={15} />
    </div>
  )
}

// app/dashboard/[eventId]/videos/loading.tsx
import { VideoJobSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function VideosLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-48 w-full" rounded="lg" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2].map(i => <VideoJobSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}

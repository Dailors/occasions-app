// app/upload/[token]/loading.tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header skeleton */}
      <div className="bg-brand-500 px-6 pt-10 pb-8">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <Skeleton className="h-5 w-24 bg-white/20" rounded="full" />
          <Skeleton className="h-7 w-48 bg-white/20" />
          <Skeleton className="h-4 w-32 bg-white/20" />
        </div>
      </div>

      {/* Upload zone skeleton */}
      <div className="flex-1 px-6 py-6 max-w-md mx-auto w-full flex flex-col gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-48 w-full" rounded="lg" />
        <Skeleton className="h-14 w-full" rounded="lg" />
      </div>
    </div>
  )
}

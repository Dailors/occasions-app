// app/dashboard/[eventId]/qr/loading.tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function QRLoading() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="text-center mb-10 flex flex-col items-center gap-3">
        <Skeleton className="h-6 w-32" rounded="full" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-3 gap-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-gray-100">
            <Skeleton className="h-8 w-8" rounded="full" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-44 w-44" rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

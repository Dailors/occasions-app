// components/ui/Skeleton.tsx
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  rounded?:   'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-100',
        {
          'rounded':    rounded === 'sm',
          'rounded-xl': rounded === 'md',
          'rounded-2xl':rounded === 'lg',
          'rounded-full':rounded === 'full',
        },
        className
      )}
    />
  )
}

// Pre-built skeleton layouts

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3.5 w-24" />
      <div className="flex gap-4 mt-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  )
}

export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" rounded="lg" />
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[0,1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-10" />
        </div>
      ))}
    </div>
  )
}

export function VideoJobSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16" rounded="full" />
      </div>
      <Skeleton className="h-1.5 w-full" rounded="full" />
    </div>
  )
}

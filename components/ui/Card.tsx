// components/ui/Card.tsx
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        {
          'p-0':  padding === 'none',
          'p-4':  padding === 'sm',
          'p-6':  padding === 'md',
          'p-8':  padding === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// components/ui/Badge.tsx
interface BadgeProps {
  children: React.ReactNode
  color?: 'gray' | 'green' | 'yellow' | 'red' | 'blue' | 'brand'
  className?: string
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  const colors = {
    gray:  'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    yellow:'bg-yellow-100 text-yellow-700',
    red:   'bg-red-100 text-red-700',
    blue:  'bg-blue-100 text-blue-700',
    brand: 'bg-brand-100 text-brand-700',
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      colors[color],
      className
    )}>
      {children}
    </span>
  )
}

// components/ui/Button.tsx
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          // Variants
          'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-400 shadow-sm':
            variant === 'primary',
          'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 shadow-sm':
            variant === 'secondary',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-300':
            variant === 'ghost',
          'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-sm':
            variant === 'danger',
          // Sizes
          'text-sm px-3 py-1.5':    size === 'sm',
          'text-sm px-4 py-2.5':    size === 'md',
          'text-base px-6 py-3':    size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

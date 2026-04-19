// components/ui/ErrorBoundary.tsx
'use client'
import { Component, type ReactNode } from 'react'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

interface Props   { children: ReactNode; fallback?: ReactNode }
interface State   { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message }
  }

  componentDidCatch(err: Error) {
    console.error('[ErrorBoundary]', err)
  }

  reset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">{this.state.message}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={this.reset}>Try again</Button>
      </div>
    )
  }
}

// Inline error for async data failures
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
      <p className="text-sm text-red-600 flex-1">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="text-red-500 hover:text-red-700">
          Retry
        </Button>
      )}
    </div>
  )
}

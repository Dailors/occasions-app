import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null, pattern = 'dd MMM yyyy'): string {
  if (!date) return '—'
  try { return format(parseISO(date), pattern) } catch { return date }
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  return (bytes / 1024 ** 3).toFixed(2) + ' GB'
}

// CRITICAL: Builds upload URL using current browser origin (not .env)
// This way the link works on whatever domain is actually live
export function buildUploadUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/upload/${token}`
  }
  // Server-side fallback
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://accasion-app-elmirjimmy.vercel.app'
  return `${base}/upload/${token}`
}

export function buildClaimUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/claim/${token}`
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://accasion-app-elmirjimmy.vercel.app'
  return `${base}/claim/${token}`
}

export function albumTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mixed: 'Mixed (all guests)',
    men: 'Men only',
    women: 'Women only',
  }
  return labels[type] ?? type
}

export function albumIcon(type: string): string {
  const icons: Record<string, string> = {
    mixed: '📸',
    men: '🤵',
    women: '👰',
  }
  return icons[type] ?? '📷'
}

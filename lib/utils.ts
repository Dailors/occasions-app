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

export function buildUploadUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/upload/${token}`
  }
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

// These were missing from the old utils.ts — adding them now
export function categoryLabel(category: string | null): string {
  if (!category) return 'Uncategorized'
  const labels: Record<string, string> = {
    couple:    'Couple',
    family:    'Family',
    ceremony:  'Ceremony',
    dance:     'Dance',
    venue:     'Venue',
  }
  return labels[category] ?? category
}

export function emotionEmoji(emotion: string | null): string {
  if (!emotion) return ''
  const emojis: Record<string, string> = {
    happy:     '😊',
    emotional: '🥹',
    energetic: '🎉',
    neutral:   '😐',
  }
  return emojis[emotion] ?? ''
}

export function emotionLabel(emotion: string | null): string {
  if (!emotion) return 'Neutral'
  return emotion.charAt(0).toUpperCase() + emotion.slice(1)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

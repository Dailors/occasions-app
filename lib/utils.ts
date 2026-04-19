// lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null, pattern = 'dd MMM yyyy'): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), pattern)
  } catch {
    return date
  }
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function buildUploadUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/upload/${token}`
}

// Returns a short human-readable name for an album type
export function albumTypeLabel(type: string): string {
  return { mixed: 'Mixed (all guests)', men: 'Men only', women: 'Women only' }[type] ?? type
}

export function jobStatusColor(status: string): string {
  return {
    pending:    'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    done:       'bg-green-100 text-green-800',
    failed:     'bg-red-100 text-red-800',
  }[status] ?? 'bg-gray-100 text-gray-800'
}

export function emotionEmoji(emotion: string | null): string {
  return { happy: '😊', emotional: '🥹', energetic: '🎉', neutral: '😐' }[emotion ?? ''] ?? '—'
}

export function categoryLabel(cat: string | null): string {
  return {
    couple:   'Couple',
    family:   'Family',
    ceremony: 'Ceremony',
    dance:    'Dance / Party',
    venue:    'Venue',
  }[cat ?? ''] ?? '—'
}

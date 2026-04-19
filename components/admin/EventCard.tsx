// components/admin/EventCard.tsx
'use client'
import Link from 'next/link'
import { CalendarDays, Image as ImageIcon, Users, ChevronRight } from 'lucide-react'
import { Card, Badge } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import type { EventSummary } from '@/types'

interface EventCardProps {
  event: EventSummary
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/dashboard/${event.id}`}>
      <Card className="hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif text-lg font-semibold text-gray-900 truncate">
                {event.couple_names}
              </h3>
              <Badge color={event.status === 'active' ? 'green' : 'gray'}>
                {event.status}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{formatDate(event.wedding_date)}</span>
            </div>

            <div className="flex items-center gap-5 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                <span>{event.media_count} files</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span>{event.guest_count} guests</span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  )
}

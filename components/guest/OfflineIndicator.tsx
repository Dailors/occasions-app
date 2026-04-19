// components/guest/OfflineIndicator.tsx
// Shows a banner when the guest loses network connectivity.
// Critical for MENA where mobile internet drops during large events.

'use client'
import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const [offline,    setOffline]    = useState(false)
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    const handleOffline = () => setOffline(true)
    const handleOnline  = () => {
      setOffline(false)
      setShowOnline(true)
      setTimeout(() => setShowOnline(false), 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)
    // Set initial state
    if (!navigator.onLine) setOffline(true)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

  if (!offline && !showOnline) return null

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
        transition-all duration-300
        ${offline
          ? 'bg-red-500 text-white'
          : 'bg-green-500 text-white'
        }
      `}
    >
      {offline ? (
        <>
          <WifiOff className="w-4 h-4" />
          No internet connection — uploads will resume when you reconnect
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          Back online
        </>
      )}
    </div>
  )
}

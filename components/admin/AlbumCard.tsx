// components/admin/AlbumCard.tsx
'use client'
import { useState } from 'react'
import { QrCode, Copy, Check, Download } from 'lucide-react'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { buildUploadUrl, albumTypeLabel } from '@/lib/utils'
import type { Album } from '@/types'
import Image from 'next/image'

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album }: AlbumCardProps) {
  const [copied,    setCopied]    = useState(false)
  const [qrOpen,    setQrOpen]    = useState(false)
  const [qrSvg,     setQrSvg]     = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)

  const uploadUrl = buildUploadUrl(album.access_token)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(uploadUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShowQR = async () => {
    setQrOpen(true)
    if (qrSvg) return
    setLoadingQr(true)
    try {
      const res = await fetch(`/api/albums/${album.id}/qr?format=svg`)
      const svg = await res.text()
      setQrSvg(svg)
    } finally {
      setLoadingQr(false)
    }
  }

  const handleDownloadQR = async () => {
    const res  = await fetch(`/api/albums/${album.id}/qr?format=png`)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `occasions-qr-${album.type}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const typeColors: Record<string, 'gray' | 'blue' | 'brand'> = {
    mixed: 'brand', men: 'blue', women: 'gray',
  }

  return (
    <>
      <Card padding="sm" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 text-sm">{album.name}</h4>
          <Badge color={typeColors[album.type] ?? 'gray'}>
            {albumTypeLabel(album.type)}
          </Badge>
        </div>

        <p className="text-xs text-gray-400 font-mono truncate">{uploadUrl}</p>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy} className="flex-1 gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleShowQR}>
            <QrCode className="w-3.5 h-3.5" />
            QR code
          </Button>
        </div>
      </Card>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={`QR Code — ${album.name}`} size="sm">
        <div className="flex flex-col items-center gap-4">
          {loadingQr ? (
            <div className="w-48 h-48 rounded-xl bg-gray-50 animate-pulse" />
          ) : qrSvg ? (
            <div
              className="w-48 h-48 rounded-xl overflow-hidden"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : null}
          <p className="text-xs text-gray-500 text-center">
            Guests scan this to open the upload page directly.
          </p>
          <Button variant="secondary" size="sm" onClick={handleDownloadQR} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </Button>
        </div>
      </Modal>
    </>
  )
}

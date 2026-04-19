// components/guest/UploadZone.tsx  (v2 — with compression + retry)
'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon, Film, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { compressImage, blobToFile } from '@/lib/compress'
import { useUpload } from '@/hooks/useUpload'
import toast from 'react-hot-toast'

interface UploadZoneProps {
  eventId: string
  albumId: string
}

export function UploadZone({ eventId, albumId }: UploadZoneProps) {
  const { queue, upload, retry, counts } = useUpload(eventId, albumId)

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) return

    // Compress images in browser before uploading
    const prepared = await Promise.all(
      accepted.map(async (file) => {
        if (!file.type.startsWith('image/')) return file
        try {
          const { blob } = await compressImage(file)
          return blobToFile(blob, file.name)
        } catch {
          return file
        }
      })
    )

    await upload(prepared)
  }, [upload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.3gp'],
    },
    maxSize:  200 * 1024 * 1024,
    multiple: true,
  })

  const isUploading = counts.uploading > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-brand-400 bg-brand-50 scale-[1.01]'
            : 'border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/50'
        )}
      >
        <input {...getInputProps()} />

        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200',
          isDragActive ? 'bg-brand-500' : 'bg-white shadow-sm border border-gray-100'
        )}>
          {isUploading
            ? <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            : <Upload className={cn('w-6 h-6', isDragActive ? 'text-white' : 'text-brand-400')} />
          }
        </div>

        <div className="text-center">
          <p className="font-medium text-gray-900">
            {isDragActive ? 'Drop files here' : 'Tap to upload or drag & drop'}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">Photos & videos · Max 200 MB each</p>
        </div>

        {counts.total > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${counts.total > 0 ? (counts.done / counts.total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{counts.done}/{counts.total}</span>
          </div>
        )}
      </div>

      {/* File list */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scroll-hide">
          {queue.map(item => (
            <div key={item.tempId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.preview_url
                  ? <img src={item.preview_url} alt="" className="w-full h-full object-cover" />
                  : item.file.type.startsWith('video/')
                    ? <div className="w-full h-full flex items-center justify-center"><Film className="w-4 h-4 text-gray-400" /></div>
                    : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-400" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(item.file.size)}</p>
              </div>
              <div className="flex-shrink-0">
                {item.status === 'queued'    && <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                {item.status === 'uploading' && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
                {item.status === 'done'      && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {item.status === 'error'     && (
                  <button onClick={() => retry(item.tempId)} title="Retry upload">
                    <XCircle className="w-4 h-4 text-red-400 hover:text-red-600 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

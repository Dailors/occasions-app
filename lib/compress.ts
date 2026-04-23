// lib/compress.ts
// Browser-side image compression. Runs on guest's phone before upload.
// Returns both: compressed preview (1200px) and original file.

export interface CompressedResult {
  original:   File          // the untouched original
  compressed: Blob | null   // compressed preview, or null if compression failed
}

export async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<CompressedResult> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return { original: file, compressed: null }
  }

  try {
    const img = await loadImage(file)

    // Calculate new dimensions (preserve aspect ratio)
    const ratio = Math.min(1, maxWidth / img.width)
    const w = Math.round(img.width * ratio)
    const h = Math.round(img.height * ratio)

    // Draw to canvas
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return { original: file, compressed: null }

    ctx.drawImage(img, 0, 0, w, h)

    // Convert to JPEG blob
    const compressed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
    })

    return { original: file, compressed }
  } catch (err) {
    console.error('Compression failed:', err)
    return { original: file, compressed: null }
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

// Extract a keyframe from a video (middle of the video)
// Returns a compressed JPEG blob ready for vision analysis
export async function extractVideoFrame(file: File, timeSec?: number): Promise<Blob | null> {
  if (!file.type.startsWith('video/')) return null

  try {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const url = URL.createObjectURL(file)
    video.src = url

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('video load failed'))
    })

    const t = typeof timeSec === 'number'
      ? Math.min(timeSec, video.duration - 0.1)
      : Math.min(video.duration / 2, 10)  // middle or 10s in

    video.currentTime = t

    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
    })

    const canvas = document.createElement('canvas')
    const maxW = 1200
    const ratio = Math.min(1, maxW / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * ratio)
    canvas.height = Math.round(video.videoHeight * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) { URL.revokeObjectURL(url); return null }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82)
    })
  } catch (err) {
    console.error('Video frame extract failed:', err)
    return null
  }
}

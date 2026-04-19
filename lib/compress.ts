// lib/compress.ts
// Maximum quality upload — no resizing, no quality loss.
// Images are converted to JPEG at 100% quality only if needed for format compatibility.
// HEIC files from iPhones are converted to JPEG. Everything else goes up as-is.

export interface CompressResult {
  blob:           Blob
  originalSize:   number
  compressedSize: number
}

export async function compressImage(file: File): Promise<CompressResult> {
  // Only process HEIC/HEIF files (iPhone photos) — everything else uploads as original
  const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif')

  if (!isHEIC) {
    // Return original file unchanged — full quality, full resolution
    return {
      blob:           file,
      originalSize:   file.size,
      compressedSize: file.size,
    }
  }

  // Convert HEIC to JPEG at 100% quality so browsers can display previews
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported'))

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Conversion failed'))
          resolve({
            blob,
            originalSize:   file.size,
            compressedSize: blob.size,
          })
        },
        'image/jpeg',
        1.0    // 100% quality — no loss
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      // If HEIC can't be read (browser doesn't support it), upload original
      resolve({ blob: file, originalSize: file.size, compressedSize: file.size })
    }

    img.src = url
  })
}

export function blobToFile(blob: Blob, originalName: string): File {
  // Keep original extension unless we converted HEIC → JPEG
  const wasHEIC = originalName.toLowerCase().endsWith('.heic') ||
                  originalName.toLowerCase().endsWith('.heif')
  const name = wasHEIC
    ? originalName.replace(/\.(heic|heif)$/i, '.jpg')
    : originalName
  return new File([blob], name, { type: blob.type, lastModified: Date.now() })
}

// lib/video/ffmpeg.ts
// The real FFmpeg render pipeline. Only imported in production
// when FFMPEG_PATH is set. Not loaded during local development.

import ffmpeg    from 'fluent-ffmpeg'
import * as fs   from 'fs'
import * as path from 'path'
import * as os   from 'os'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { VideoTemplate, SegmentMap, VideoFormat } from '@/types'
import type { RenderResult }        from './renderer'

if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH)

async function downloadToTemp(storagePath: string): Promise<string> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.storage.from('media-originals').download(storagePath)
  if (error || !data) throw new Error(`Download failed: ${storagePath}`)
  const ext = path.extname(storagePath) || '.jpg'
  const tmp = path.join(os.tmpdir(), `occ_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
  fs.writeFileSync(tmp, Buffer.from(await data.arrayBuffer()))
  return tmp
}

async function uploadVideo(localPath: string, storagePath: string): Promise<void> {
  const supabase = createServiceRoleClient()
  const { error } = await supabase.storage
    .from('generated-videos')
    .upload(storagePath, fs.readFileSync(localPath), { contentType: 'video/mp4', upsert: true })
  if (error) throw new Error(`Upload failed: ${error.message}`)
}

export async function renderWithFFmpeg(
  template:   VideoTemplate,
  segmentMap: SegmentMap,
  mediaRows:  Array<{ id: string; url_original: string; type: string }>,
  eventId:    string,
  jobId:      string,
): Promise<RenderResult[]> {
  const tmpFiles: string[] = []
  const results: RenderResult[] = []

  try {
    const segmentFiles: string[] = []
    for (let i = 0; i < template.segments.length; i++) {
      const mediaId = segmentMap[String(i)]
      if (!mediaId) continue
      const row = mediaRows.find(m => m.id === mediaId)
      if (!row) continue
      const local = await downloadToTemp(row.url_original)
      tmpFiles.push(local)
      segmentFiles.push(local)
    }

    if (segmentFiles.length === 0) throw new Error('No media files to render')

    const concatPath = path.join(os.tmpdir(), `concat_${jobId}.txt`)
    fs.writeFileSync(concatPath, segmentFiles.map(f => `file '${f}'`).join('\n'))
    tmpFiles.push(concatPath)

    const formats: Array<{ format: VideoFormat; suffix: string; scale: string; maxDuration: number }> = [
      { format: 'highlight',   suffix: 'highlight', scale: '1080:1920', maxDuration: template.duration },
      { format: 'reel',        suffix: 'reel',      scale: '1080:1920', maxDuration: template.duration },
      { format: 'status_clip', suffix: 'status',    scale: '720:1280',  maxDuration: 30 },
    ]

    for (const fmt of formats) {
      const out = path.join(os.tmpdir(), `occ_${jobId}_${fmt.suffix}.mp4`)
      tmpFiles.push(out)

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(concatPath)
          .inputOptions(['-f concat', '-safe 0'])
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            `-vf scale=${fmt.scale}:force_original_aspect_ratio=decrease,pad=${fmt.scale}:(ow-iw)/2:(oh-ih)/2`,
            '-crf 23', '-preset fast', '-pix_fmt yuv420p', '-movflags +faststart',
            `-t ${fmt.maxDuration}`,
          ])
          .output(out)
          .on('end', resolve)
          .on('error', reject)
          .run()
      })

      const storagePath = `${eventId}/${jobId}/${fmt.suffix}.mp4`
      await uploadVideo(out, storagePath)
      results.push({ format: fmt.format, storagePath, fileSizeBytes: fs.statSync(out).size })
    }

    return results
  } finally {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f) } catch { /* ignore */ }
    }
  }
}

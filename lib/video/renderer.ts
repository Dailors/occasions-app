// lib/video/renderer.ts
// Builds the final video from a template + segment map using FFmpeg.
// In development (when FFMPEG_PATH is not set), returns mock results
// so the app runs without FFmpeg installed locally.

import type { VideoTemplate, SegmentMap, VideoFormat } from '@/types'

export interface RenderResult {
  format:        VideoFormat
  storagePath:   string
  fileSizeBytes: number
}

export async function renderVideo(
  template:   VideoTemplate,
  segmentMap: SegmentMap,
  mediaRows:  Array<{ id: string; url_original: string; type: string }>,
  eventId:    string,
  jobId:      string,
): Promise<RenderResult[]> {
  const isDev = !process.env.FFMPEG_PATH

  if (isDev) {
    // Development stub — simulates a 3-second render so the dashboard
    // shows the full job lifecycle without needing FFmpeg installed.
    console.log('[renderer] DEV MODE — no FFmpeg. Returning mock results.')
    await new Promise(r => setTimeout(r, 3000))
    const formats: VideoFormat[] = ['highlight', 'reel', 'status_clip']
    return formats.map(format => ({
      format,
      storagePath:   `${eventId}/${jobId}/${format}.mp4`,
      fileSizeBytes: 1_000_000,
    }))
  }

  // Production: dynamic import keeps fluent-ffmpeg out of the dev bundle
  const { renderWithFFmpeg } = await import('./ffmpeg')
  return renderWithFFmpeg(template, segmentMap, mediaRows, eventId, jobId)
}

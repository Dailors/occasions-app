// types/index.ts
// All shared types for the Occasions platform

export type UserRole = 'admin' | 'guest'
export type EventStatus = 'active' | 'closed'
export type AlbumType = 'mixed' | 'men' | 'women'
export type MediaType = 'photo' | 'video'
export type MediaCategory = 'couple' | 'family' | 'ceremony' | 'dance' | 'venue'
export type MediaEmotion = 'happy' | 'emotional' | 'energetic' | 'neutral'
export type VideoFormat = 'highlight' | 'reel' | 'status_clip'
export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

// ── Database row types ───────────────────────────────────────

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Event {
  id: string
  admin_id: string
  couple_names: string
  wedding_date: string | null
  location: string | null
  status: EventStatus
  created_at: string
}

export interface Album {
  id: string
  event_id: string
  name: string
  type: AlbumType
  access_token: string
  created_at: string
}

export interface EventGuest {
  id: string
  event_id: string
  album_id: string
  user_id: string
  access_token: string
  joined_at: string
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>
}

export interface Media {
  id: string
  event_id: string
  album_id: string
  uploader_id: string
  type: MediaType
  url_original: string
  url_compressed: string | null
  file_size: number | null
  uploaded_at: string
  // joined
  preview_url?: string | null
}

export interface MediaTag {
  id: string
  media_id: string
  category: MediaCategory | null
  emotion: MediaEmotion | null
  quality_score: number | null
  raw_tags: Record<string, unknown> | null
  tagged_at: string
}

export interface MediaWithTags extends Media {
  category: MediaCategory | null
  emotion: MediaEmotion | null
  quality_score: number | null
  raw_tags: Record<string, unknown> | null
}

export interface VideoJob {
  id: string
  event_id: string
  template_id: string
  status: JobStatus
  segment_map: SegmentMap | null
  error_message: string | null
  created_at: string
  completed_at: string | null
  generated_videos?: GeneratedVideo[]
}

export interface GeneratedVideo {
  id: string
  job_id: string
  format: VideoFormat
  url: string
  file_size: number | null
  created_at: string
  download_url?: string | null
}

// ── Template types ───────────────────────────────────────────

export interface TemplateSegment {
  start: number
  end: number
  requirement: string           // e.g. 'couple_best', 'ceremony_emotion'
  media_type: 'photo' | 'video' | 'photo_or_video' | 'video_priority'
  transition?: 'fade' | 'cut' | 'dissolve' | 'zoom'
  text_overlay?: string
  filter?: string
}

export interface VideoTemplate {
  template_id: string
  name: string
  description: string
  duration: number              // seconds
  aspect_ratio: '9:16' | '16:9' | '1:1'
  music_style: string
  music_file?: string           // path to bundled music file
  segments: TemplateSegment[]
  thumbnail?: string
}

export type SegmentMap = Record<string, string>   // segment_index → media_id

// ── View types ───────────────────────────────────────────────

export interface EventSummary {
  id: string
  couple_names: string
  wedding_date: string | null
  status: EventStatus
  guest_count: number
  media_count: number
  photo_count: number
  video_count: number
}

// ── API response types ───────────────────────────────────────

export interface JoinAlbumResponse {
  album: Pick<Album, 'id' | 'name' | 'type'>
  event: Pick<Event, 'id' | 'couple_names' | 'wedding_date'>
}

export interface UploadResponse {
  media: {
    id: string
    type: MediaType
    preview_url: string | null
    uploaded_at: string
  }
}

export interface DashboardResponse {
  event: EventSummary | null
  albums: Album[]
  guests: EventGuest[]
  media: MediaWithTags[]
  video_jobs: VideoJob[]
}

// ── AI tagging types ─────────────────────────────────────────

export interface AITagResult {
  category: MediaCategory
  emotion: MediaEmotion
  quality_score: number
  raw_tags: Record<string, unknown>
}

// ── Social content types ──────────────────────────────────────

export interface SocialContent {
  caption: string
  hashtags: string[]
  story_overlay: string
}

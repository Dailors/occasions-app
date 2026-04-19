// lib/supabase/types.ts
// Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts`
// to replace this stub with auto-generated types from your actual schema.
//
// Until then this re-exports the hand-written domain types so imports don't break.

export type { Profile, Event, Album, EventGuest, Media, MediaTag, VideoJob, GeneratedVideo } from '@/types'

// Minimal Database type accepted by createBrowserClient / createServerClient
export type Database = {
  public: {
    Tables: {
      profiles:        { Row: any; Insert: any; Update: any }
      events:          { Row: any; Insert: any; Update: any }
      albums:          { Row: any; Insert: any; Update: any }
      event_guests:    { Row: any; Insert: any; Update: any }
      media:           { Row: any; Insert: any; Update: any }
      media_tags:      { Row: any; Insert: any; Update: any }
      video_jobs:      { Row: any; Insert: any; Update: any }
      generated_videos:{ Row: any; Insert: any; Update: any }
    }
    Views: {
      media_with_tags: { Row: any }
      event_summary:   { Row: any }
    }
    Functions: {
      is_event_admin:  { Args: { event_id: string }; Returns: boolean }
      current_role:    { Args: Record<string, never>; Returns: string }
    }
    Enums: {}
  }
}

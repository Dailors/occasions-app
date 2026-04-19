// lib/ai/mapper.ts
// Maps template segments to the best matching media items.
// Pure logic — no API calls. Uses pre-computed AI tags from the database.

import type { MediaWithTags, TemplateSegment, SegmentMap, MediaCategory, MediaEmotion } from '@/types'

// Requirement string → what category + emotion to prefer
const REQUIREMENT_MAP: Record<string, { categories: MediaCategory[], emotions: MediaEmotion[], preferVideo?: boolean }> = {
  venue_wide:        { categories: ['venue'],             emotions: ['neutral', 'happy'] },
  couple_best:       { categories: ['couple'],            emotions: ['happy', 'emotional'] },
  ceremony_emotion:  { categories: ['ceremony'],          emotions: ['emotional', 'happy'],  preferVideo: true },
  emotional_close:   { categories: ['couple', 'family'],  emotions: ['emotional', 'happy'] },
  family_group:      { categories: ['family'],            emotions: ['happy', 'energetic'] },
  dance_energy:      { categories: ['dance'],             emotions: ['energetic', 'happy'],  preferVideo: true },
  reception_party:   { categories: ['dance', 'venue'],    emotions: ['energetic', 'happy'],  preferVideo: true },
  intimate_couple:   { categories: ['couple'],            emotions: ['emotional'] },
  candid_moment:     { categories: ['family', 'ceremony'],emotions: ['happy', 'emotional'] },
  entrance:          { categories: ['ceremony', 'venue'], emotions: ['emotional', 'happy'],  preferVideo: true },
}

function scoreMedia(media: MediaWithTags, segment: TemplateSegment): number {
  const req = REQUIREMENT_MAP[segment.requirement]
  if (!media.quality_score) return 0

  let score = media.quality_score

  // Category match bonus
  if (req?.categories.includes(media.category as MediaCategory)) score += 0.3

  // Emotion match bonus
  const emotionIdx = req?.emotions.indexOf(media.emotion as MediaEmotion) ?? -1
  if (emotionIdx === 0) score += 0.25
  if (emotionIdx === 1) score += 0.15

  // Media type preference
  if (segment.media_type === 'video_priority' && media.type === 'video') score += 0.2
  if (segment.media_type === 'photo' && media.type === 'photo')           score += 0.1
  if (req?.preferVideo && media.type === 'video')                         score += 0.15

  return score
}

export function mapMediaToTemplate(
  segments: TemplateSegment[],
  mediaPool: MediaWithTags[]
): SegmentMap {
  const usedIds = new Set<string>()
  const result: SegmentMap = {}

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // Score all unused media for this segment
    const candidates = mediaPool
      .filter(m => !usedIds.has(m.id))
      .map(m => ({ id: m.id, score: scoreMedia(m, segment) }))
      .sort((a, b) => b.score - a.score)

    if (candidates.length === 0) continue

    const best = candidates[0]
    result[String(i)] = best.id
    usedIds.add(best.id)
  }

  return result
}

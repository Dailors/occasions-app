// lib/ai/tagger.ts
// Analyzes a photo or video thumbnail using Claude vision API.
// Returns category, emotion, and quality_score.

import Anthropic from '@anthropic-ai/sdk'
import type { AITagResult, MediaCategory, MediaEmotion } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an AI media analyst for a wedding photography platform.
Analyze the image and return ONLY a valid JSON object — no markdown, no preamble.

Categories: couple | family | ceremony | dance | venue
Emotions:   happy | emotional | energetic | neutral

Quality score rules (0.0–1.0):
- 0.9+: sharp, well-lit, composed, faces clearly visible
- 0.7–0.9: good quality with minor issues
- 0.5–0.7: acceptable but noisy/blurry/dark
- <0.5: poor quality

Return exactly:
{
  "category": "<one of the 5 categories>",
  "emotion": "<one of the 4 emotions>",
  "quality_score": <float 0–1>,
  "notes": "<one-line optional description>"
}`

export async function tagMedia(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<AITagResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          {
            type: 'text',
            text: 'Analyze this wedding media.',
          },
        ],
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? '{}'
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

  return {
    category:      parsed.category    as MediaCategory ?? 'venue',
    emotion:       parsed.emotion     as MediaEmotion  ?? 'neutral',
    quality_score: Math.min(1, Math.max(0, Number(parsed.quality_score ?? 0.5))),
    raw_tags:      parsed,
  }
}

// For videos: extract first frame as base64, then tag it
export async function tagVideoThumbnail(thumbnailBase64: string): Promise<AITagResult> {
  return tagMedia(thumbnailBase64)
}

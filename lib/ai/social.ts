// lib/ai/social.ts
// Generates captions, story overlays, and hashtags for social sharing.

import Anthropic from '@anthropic-ai/sdk'
import type { SocialContent } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateSocialContent(
  coupleNames: string,
  weddingDate: string | null
): Promise<SocialContent> {
  const dateStr = weddingDate ? new Date(weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    system: `You generate social media content for weddings. Return ONLY valid JSON, no markdown.`,
    messages: [
      {
        role: 'user',
        content: `Generate social media content for ${coupleNames}'s wedding${dateStr ? ` on ${dateStr}` : ''}.
Return exactly:
{
  "caption": "<warm 1-2 sentence Instagram caption>",
  "hashtags": ["<5 relevant wedding hashtags without #>"],
  "story_overlay": "<short 3-5 word overlay text for stories>"
}`,
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? '{}'
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

  return {
    caption:       parsed.caption       ?? `Forever begins today. 💍`,
    hashtags:      parsed.hashtags      ?? ['wedding', 'love', 'bride', 'weddingday', 'forever'],
    story_overlay: parsed.story_overlay ?? 'Forever starts here',
  }
}

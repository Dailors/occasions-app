// app/api/support/route.ts
// Customer support chatbot using Claude Haiku 4.5 (cheap, ~$0.0001/message).
// Rate limited to 30 msg/hour, 100/day per user.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

const SYSTEM_PROMPT = `You are the friendly customer support assistant for Occasions, a private wedding and event memory platform for the MENA (Middle East and North Africa) region.

ABOUT OCCASIONS:
- Private photo/video collection for weddings and events
- Guests scan a QR code or tap a link to upload media from their phones
- Only the host (bride/groom) sees all uploaded media
- Guests only see their own uploads (privacy protected at the database level)
- 3 albums per event: Mixed (all guests), Men only, Women only
- Women's album can be PIN-protected — even the host needs the PIN to view
- AI auto-analyzes every photo for quality and category
- AI generates cinematic highlight videos + Instagram stories, posts, and photo dumps
- Arabic and English supported

TWO ROLES:
- Event Manager (B2B): Wedding planners who buy credits (1 credit = 1 event) and create events for clients
- Host (B2C): The bride/groom who receives a claim link from their manager and takes over the event
- Guests: Just scan/tap to upload — no account needed (anonymous sign-in)

PRICING (SAR):
- 1 credit: 39.99 SAR
- 5 credits: 179.99 SAR
- 10 credits: 329.99 SAR
- 25 credits: 749.99 SAR

HANDOFF FLOW:
1. Manager creates event → gets a claim link
2. Manager sends link to bride via WhatsApp
3. Bride clicks → signs up / logs in → claims the event
4. After claim: bride has full access, manager permanently loses all media access

RULES:
- Only answer questions about Occasions
- If asked anything unrelated, politely redirect: "I can only help with Occasions questions — is there anything about the app I can help with?"
- Be warm, brief, and helpful (2-4 sentences usually)
- Match the user's language (English or Arabic)
- Never make up features that don't exist`

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })

    // Rate limit
    const rate = await checkRateLimit(user.id, 'support_chat')
    if (!rate.allowed) {
      return NextResponse.json({
        error: `Too many messages. Try again in ${Math.ceil(rate.reset_in_seconds / 60)} minutes.`
      }, { status: 429 })
    }

    const { messages, lang } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server config issue. Contact support.' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    // Only keep the last 10 messages to keep context small & cheap
    const recent = messages.slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, 2000),
    }))

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',  // CHEAP
      max_tokens: 400,
      system: SYSTEM_PROMPT + (lang === 'ar' ? '\n\nReply in Arabic.' : ''),
      messages: recent,
    })

    const reply = res.content[0].type === 'text' ? res.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('Support chat error:', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

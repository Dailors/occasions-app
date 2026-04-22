// app/api/support/route.ts
// Customer support chatbot. Answers only about Occasions app.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const SYSTEM_PROMPT = `You are the customer support assistant for Occasions, a private wedding and event memory platform for MENA (Middle East and North Africa).

ABOUT OCCASIONS:
- Private photo/video collection for weddings and events
- Guests scan a QR code or tap a link to upload photos from their phones
- Only the host (bride/groom) sees all uploaded media
- Guests only see their own uploads (privacy protected)
- 3 albums per event: Mixed (all guests), Men only, Women only
- Women's album can be PIN-protected
- AI generates cinematic highlight videos + Instagram-ready stories, posts, and photo dumps
- Arabic and English supported

TWO ROLES:
- Event Manager (B2B): Wedding planners/photographers who buy credits (1 credit = 1 event) and create events for clients
- Host (B2C): The bride/groom who receives a claim link from their manager and takes over the event
- Guests: Just scan/tap to upload — no account needed

PRICING (SAR):
- 1 credit: 39.99 SAR
- 5 credits: 179.99 SAR (save 20 SAR)
- 10 credits: 329.99 SAR (save 70 SAR)
- 25 credits: 749.99 SAR (save 250 SAR)

HOW THE HANDOFF WORKS:
1. Manager creates event → gets a claim link
2. Manager sends claim link to bride/client via WhatsApp
3. Bride clicks link → signs up or logs in → claims the event
4. After claim: bride has full access, manager loses media access forever (only sees stats)

RULES:
- Only answer questions about Occasions
- If asked anything unrelated (politics, general trivia, other apps), politely redirect: "I can only help with Occasions questions. Is there something about the app I can help with?"
- Be warm, brief, and helpful
- Match the language the user writes in (English or Arabic)
- Never make up features that don't exist`

export async function POST(req: NextRequest) {
  try {
    const { messages, lang } = await req.json()

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

    const res = await client.messages.create({
      model: 'claude-opus-4-5-20250929',
      max_tokens: 500,
      system: SYSTEM_PROMPT + (lang === 'ar' ? '\n\nReply in Arabic.' : ''),
      messages: anthropicMessages,
    })

    const reply = res.content[0].type === 'text' ? res.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('Support chat error:', err)
    return NextResponse.json({ error: err.message ?? 'Error' }, { status: 500 })
  }
}

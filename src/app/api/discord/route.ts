import { formatDiscordMessage } from '@/lib/discord'
import type { DiscordEvent } from '@/types/discord.types'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  let event: DiscordEvent
  try {
    event = (await request.json()) as DiscordEvent
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const content = formatDiscordMessage(event)
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { formatDiscordMessage } from '@/lib/discord'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { DiscordEvent, DiscordEventInput } from '@/types/discord.types'

/** Rolls carry at most an advantage pair; anything longer is not a roll. */
const MAX_REPORTED_ROLLS = 12

/**
 * Discord renders whatever it is handed, and everything here still originates
 * in a browser. Keep it to plain, bounded text: no fences to break out of the
 * code block, no mass pings, no walls of text.
 */
function clean(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value
    .replace(/[`*_~|\\]/g, '')
    .replace(/@(everyone|here)/gi, '@​$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
  return text || undefined
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined
}

/** Rebuilds the event from scratch, field by field: unknown keys never survive. */
function parseEvent(raw: unknown): DiscordEventInput | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>

  switch (e.type) {
    case 'roll': {
      const label = clean(e.label, 60)
      const die = clean(e.die, 24)
      const result = num(e.result)
      const total = num(e.total)
      if (!label || !die || result === undefined || total === undefined) return null

      const rolls = Array.isArray(e.rolls)
        ? e.rolls.map(num).filter((n): n is number => n !== undefined).slice(0, MAX_REPORTED_ROLLS)
        : []
      const dc = num(e.dc)

      return {
        type: 'roll',
        label,
        subLabel: clean(e.subLabel, 60),
        die,
        result,
        total,
        modifier: num(e.modifier),
        isCritical: e.isCritical === true,
        isFumble: e.isFumble === true,
        ...(rolls.length > 0 && { rolls }),
        ...(dc !== undefined && { dc, success: e.success === true }),
      }
    }
    case 'torch_lit':
    case 'torch_warning': {
      const minutesLeft = num(e.minutesLeft)
      if (minutesLeft === undefined) return null
      return { type: e.type, minutesLeft: Math.max(0, minutesLeft) }
    }
    case 'torch_out':
      return { type: 'torch_out' }
    default:
      return null
  }
}

function displayName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  return (
    clean(meta.full_name, 40) ??
    clean(meta.name, 40) ??
    clean(meta.global_name, 40) ??
    clean(meta.user_name, 40) ??
    'Aventureiro'
  )
}

/**
 * Relay to the campaign's Discord channel.
 *
 * The route used to forward the request body straight to the webhook, name and
 * all, so any player with devtools open could publish anything in the channel
 * signed as anyone. Identity now comes from the session cookie and the payload
 * is rebuilt here from validated fields.
 */
export async function POST(request: Request) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Only the campaign's own allowlist speaks in the channel.
  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub
  const { data: allowed } = await supabase
    .from('allowed_discord_ids')
    .select('discord_id')
    .eq('discord_id', discordId)
    .single()
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const event = parseEvent(raw)
  if (!event) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const content = formatDiscordMessage({ ...event, player: displayName(user) } as DiscordEvent)
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

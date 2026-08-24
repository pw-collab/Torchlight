import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { formatDiscordMessage } from '@/lib/discord'
import { buildRecap, formatRecap, type Recap } from '@/lib/recap'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { DiscordEvent, DiscordEventInput } from '@/types/discord.types'
import type { SessionEventRow } from '@/types/session.types'
import { rowToEvent } from '@/types/session.types'

/** Rolls carry at most an advantage pair; anything longer is not a roll. */
const MAX_REPORTED_ROLLS = 12

/** A recap is a summary, not a transcript: long lists and long messages get cut. */
const MAX_RECAP_ITEMS = 12
const MAX_DISCORD_MESSAGE = 1900

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The recap is derived here, not relayed.
 *
 * The browser sends a session id and nothing else: the summary is read out of
 * `session_events` under the caller's own RLS, so what reaches the channel is
 * what the log actually says — not what a client claims it says.
 *
 * Every string still passes through `clean`, because the log itself is written
 * by players: a character named with backticks would otherwise break out of the
 * message.
 */
function sanitizeRecap(recap: Recap): Recap {
  const text = (value: string, max = 48) => clean(value, max) ?? '—'
  const cap = <T,>(list: T[]) => list.slice(0, MAX_RECAP_ITEMS)

  return {
    sessionName: text(recap.sessionName, 60),
    minutes: Math.max(0, recap.minutes),
    cast: cap(recap.cast).map(name => text(name)),
    rolls: Math.max(0, recap.rolls),
    criticals: cap(recap.criticals).map(r => ({ who: text(r.who), label: text(r.label), total: r.total })),
    fumbles: cap(recap.fumbles).map(r => ({ who: text(r.who), label: text(r.label), total: r.total })),
    downs: cap(recap.downs).map(name => text(name)),
    xp: cap(recap.xp).map(x => ({ who: text(x.who), gained: x.gained })),
    torchMinutes: Math.max(0, recap.torchMinutes),
    encounters: cap(recap.encounters).map(name => text(name, 60)),
    handouts: cap(recap.handouts).map(title => text(title, 60)),
  }
}

/** The recap text, or a reason it cannot be published. */
async function recapContent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  discordId: unknown,
  sessionId: unknown,
): Promise<{ content: string } | { error: string; status: number }> {
  if (typeof sessionId !== 'string' || !UUID.test(sessionId)) {
    return { error: 'Invalid payload', status: 400 }
  }

  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, gm_id')
    .eq('id', sessionId)
    .single()

  // Only the table's own GM publishes its recap. A player at the table can read
  // the log, but the summary is the GM's to hand to the channel.
  if (!session || (session as { gm_id: string }).gm_id !== discordId) {
    return { error: 'Forbidden', status: 403 }
  }

  const { data: rows } = await supabase
    .from('session_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  const events = ((rows ?? []) as SessionEventRow[]).map(rowToEvent)
  const recap = buildRecap(events, (session as { name: string }).name)
  return { content: formatRecap(sanitizeRecap(recap)).slice(0, MAX_DISCORD_MESSAGE) }
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

  // The recap does not come from the browser at all — only the session id does.
  let content: string
  if (typeof raw === 'object' && raw !== null && (raw as { type?: unknown }).type === 'recap') {
    const built = await recapContent(supabase, discordId, (raw as { sessionId?: unknown }).sessionId)
    if ('error' in built) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }
    content = built.content
  } else {
    const event = parseEvent(raw)
    if (!event) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    content = formatDiscordMessage({ ...event, player: displayName(user) } as DiscordEvent)
  }

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

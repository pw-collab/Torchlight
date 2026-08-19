import type { DiscordEvent, DiscordEventInput } from '@/types/discord.types'

export function formatDiscordMessage(event: DiscordEvent): string {
  switch (event.type) {
    case 'roll': {
      const modifier = event.modifier ?? 0
      const sign = modifier >= 0 ? '+' : ''
      const header = `🎲 **${event.player}** — ${event.label}${event.subLabel ? ` _(${event.subLabel})_` : ''}`

      const rollLine = event.rolls && event.rolls.length > 1
        ? `${event.die}: ${event.rolls.join(', ')} → ${event.result}`
        : `${event.die}: ${event.result}`

      const block = [
        '```',
        rollLine,
        `Bônus: ${sign}${modifier}`,
        `Total: ${event.total}`,
        '```',
      ].join('\n')

      // The channel reports the verdict, not just the number — the DC travels
      // with the roll now (see `withDc` in lib/dice).
      const verdict = event.dc !== undefined
        ? `\n${event.success ? '✅ **SUCESSO**' : '❌ **FALHA**'} vs DC ${event.dc}`
        : ''

      const flag = event.isCritical
        ? '\n✨ **CRÍTICO!**'
        : event.isFumble
        ? '\n💀 **FALHA CRÍTICA!**'
        : ''

      return `${header}\n${block}${verdict}${flag}`
    }
    case 'torch_lit':
      return `🕯️ [${event.player}] Tocha acesa — ${event.minutesLeft}min restantes`
    case 'torch_warning':
      return `⚠️ [${event.player}] Tocha quase apagando — ${event.minutesLeft}min restantes`
    case 'torch_out':
      return `🌑 [${event.player}] Tocha apagou`
  }
}

/**
 * Hands an event to the relay. Who sent it is not part of the payload — the
 * route reads that from the session — so nothing here can sign a message with
 * someone else's name.
 */
export async function sendToDiscord(event: DiscordEventInput): Promise<void> {
  try {
    await fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    // Non-blocking: rolls and HP still work if Discord is down
  }
}

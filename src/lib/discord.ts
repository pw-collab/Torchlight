import type { DiscordEvent } from '@/types/discord.types'

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

      const flag = event.isCritical
        ? '\n✨ **CRÍTICO!**'
        : event.isFumble
        ? '\n💀 **FALHA CRÍTICA!**'
        : ''

      return `${header}\n${block}${flag}`
    }
    case 'torch_lit':
      return `🕯️ [${event.player}] Tocha acesa — ${event.minutesLeft}min restantes`
    case 'torch_warning':
      return `⚠️ [${event.player}] Tocha quase apagando — ${event.minutesLeft}min restantes`
    case 'torch_out':
      return `🌑 [${event.player}] Tocha apagou`
  }
}

export async function sendToDiscord(event: DiscordEvent): Promise<void> {
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

import type { DiscordEvent } from '@/types/discord.types'

export function formatDiscordMessage(event: DiscordEvent): string {
  switch (event.type) {
    case 'roll': {
      const sign = event.modifier >= 0 ? '+' : ''
      const outcome = event.success ? 'SUCESSO' : 'FALHOU'
      return `🎲 [${event.player}] ${event.die}${sign}${event.modifier} → ${event.total}   ${outcome} vs DC ${event.dc}`
    }
    case 'torch_lit':
      return `🕯️ [${event.player}] Tocha acesa — ${event.minutesLeft}min restantes`
    case 'torch_warning':
      return `⚠️ [${event.player}] Tocha quase apagando — ${event.minutesLeft}min restantes`
    case 'torch_out':
      return `🌑 [${event.player}] Tocha apagou`
    case 'hp_change': {
      const sign = event.delta > 0 ? '+' : ''
      return `❤️ [${event.player}] HP ${event.from} → ${event.to} (${sign}${event.delta})`
    }
    case 'player_down':
      return `💀 [${event.player}] Caiu — 0 HP`
    case 'luck_used':
      return `🍀 [${event.player}] Luck Token usado — restam ${event.remaining}`
    case 'session_start':
      return `⚔️ Sessão iniciada pelo GM (${event.gm})`
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

import type {
  EncounterPayload,
  HandoutPayload,
  LightPayload,
  RollPayload,
  SessionEvent,
  SessionPayload,
  VitalsPayload,
} from '@/types/session.types'

/** Uma rolagem que vale ser lembrada: o 20 e o 1. */
export interface RecapRoll {
  who: string
  label: string
  total: number
}

export interface Recap {
  sessionName: string
  /** Do primeiro ao último acontecimento, em minutos de relógio de parede. */
  minutes: number
  /** Quem esteve na mesa, pelo nome do personagem. */
  cast: string[]
  rolls: number
  criticals: RecapRoll[]
  fumbles: RecapRoll[]
  /** Quem chegou a zero. */
  downs: string[]
  xp: { who: string; gained: number }[]
  /** Minutos de luz queimados, somando o que se apagou. */
  torchMinutes: number
  encounters: string[]
  handouts: string[]
}

function actorOf(event: SessionEvent): string {
  const payload = event.payload as { characterName?: string }
  return payload.characterName ?? event.actorName
}

/**
 * O que aconteceu na sessão, dito de uma vez (§5.11).
 *
 * O log já guardava tudo — o que faltava era lê-lo de trás para a frente e
 * contar a história. É o material com que o Mestre abre a próxima sessão: quem
 * estava, quem caiu, o que a sorte deu e quanto de tocha isso custou.
 *
 * Só o que é da mesa entra. A rolagem secreta do Mestre (§6.7) fica de fora
 * mesmo quando ele é quem está lendo: o recap é publicável, e o que ele
 * escondeu na hora não pode vazar por uma porta lateral depois.
 */
export function buildRecap(events: SessionEvent[], sessionName: string): Recap {
  const table = events
    .filter(event => event.visibility === 'table')
    // O feed chega do mais novo para o mais antigo; a história se conta ao
    // contrário disso.
    .sort((a, b) => a.at - b.at)

  const cast = new Set<string>()
  const criticals: RecapRoll[] = []
  const fumbles: RecapRoll[] = []
  const downs: string[] = []
  const xpByWho = new Map<string, number>()
  const encounters: string[] = []
  const handouts: string[] = []
  /** A última leitura de cada fonte de luz, para medir o que queimou entre uma e outra. */
  const litAt = new Map<string, number>()
  let torchMinutes = 0
  let rolls = 0

  for (const event of table) {
    const who = actorOf(event)

    switch (event.kind) {
      case 'session': {
        const p = event.payload as SessionPayload
        if (p.action === 'join' && p.characterName) cast.add(p.characterName)
        break
      }
      case 'roll': {
        const p = event.payload as RollPayload
        rolls += 1
        if (p.characterName) cast.add(p.characterName)
        if (p.isCritical) criticals.push({ who, label: p.label, total: p.total })
        if (p.isFumble) fumbles.push({ who, label: p.label, total: p.total })
        break
      }
      case 'hp': {
        const p = event.payload as VitalsPayload
        // Um desfazer que devolve alguém a zero é correção de erro, não queda.
        if (!p.undo && p.to <= 0 && p.from > 0 && !downs.includes(who)) downs.push(who)
        break
      }
      case 'xp': {
        const p = event.payload as VitalsPayload
        // A soma dos deltas já é o líquido: um desfazer escreve o delta ao
        // contrário, e os dois se anulam sozinhos.
        xpByWho.set(who, (xpByWho.get(who) ?? 0) + p.delta)
        break
      }
      case 'light': {
        const p = event.payload as LightPayload
        const key = `${who}::${p.itemName ?? ''}`
        const reading = p.minutesLeft
        if (reading === undefined) break
        if (p.action === 'lit') {
          litAt.set(key, reading)
        } else {
          const before = litAt.get(key)
          // Só conta o que de fato desceu: um "apagar" sem acender antes não
          // tem de onde medir, e uma leitura maior seria uma tocha trocada.
          if (before !== undefined && before > reading) torchMinutes += before - reading
          litAt.delete(key)
        }
        break
      }
      case 'encounter': {
        const p = event.payload as EncounterPayload
        if (p.action === 'start' && p.encounterName && !encounters.includes(p.encounterName)) {
          encounters.push(p.encounterName)
        }
        if (p.action === 'down' && p.actorName && !downs.includes(p.actorName)) {
          downs.push(p.actorName)
        }
        break
      }
      case 'handout': {
        const p = event.payload as HandoutPayload
        if (p.title && !handouts.includes(p.title)) handouts.push(p.title)
        break
      }
    }
  }

  const first = table[0]?.at
  const last = table[table.length - 1]?.at
  const minutes = first !== undefined && last !== undefined
    ? Math.max(0, Math.round((last - first) / 60_000))
    : 0

  return {
    sessionName,
    minutes,
    cast: [...cast].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    rolls,
    criticals,
    fumbles,
    downs,
    xp: [...xpByWho.entries()]
      .filter(([, gained]) => gained !== 0)
      .map(([who, gained]) => ({ who, gained }))
      .sort((a, b) => b.gained - a.gained),
    torchMinutes,
    encounters,
    handouts,
  }
}

/** "1h20" — a duração como se diz, e não em minutos crus. */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`
}

/**
 * O recap em texto, pronto para o canal da campanha.
 *
 * Sem linha vazia quando não houve nada daquilo: um recap com seis "nenhum" é
 * pior do que um recap curto.
 */
export function formatRecap(recap: Recap): string {
  const lines: string[] = [`📜 **${recap.sessionName}** — ${durationLabel(recap.minutes)} de mesa`]

  if (recap.cast.length > 0) lines.push(`⚔ ${recap.cast.join(', ')}`)
  if (recap.encounters.length > 0) lines.push(`🐗 ${recap.encounters.join(' · ')}`)

  for (const crit of recap.criticals) lines.push(`✨ ${crit.who} — ${crit.label} (${crit.total})`)
  for (const fumble of recap.fumbles) lines.push(`💀 ${fumble.who} — ${fumble.label} (${fumble.total})`)

  if (recap.downs.length > 0) lines.push(`🩸 Caíram: ${recap.downs.join(', ')}`)
  if (recap.xp.length > 0) {
    lines.push(`△ XP: ${recap.xp.map(x => `${x.who} +${x.gained}`).join(', ')}`)
  }
  if (recap.torchMinutes > 0) lines.push(`🔥 ${recap.torchMinutes}min de luz queimados`)
  if (recap.handouts.length > 0) lines.push(`📖 ${recap.handouts.join(' · ')}`)
  if (recap.rolls > 0) lines.push(`🎲 ${recap.rolls} rolagens`)

  return lines.join('\n')
}

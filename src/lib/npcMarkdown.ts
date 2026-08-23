import type { NPC, NPCFeature } from '@/types/npc.types'

/**
 * O statblock escrito em Markdown, lido de volta.
 *
 * Morava dentro do modal de criação, que é onde é usado uma ficha por vez. A
 * importação em lote (§6.10) precisa do mesmo entendimento para dez fichas de
 * uma vez, e duas cópias do parser seriam duas gramáticas divergindo com o
 * tempo — o defeito que a Fase 0 passou limpando em outros cantos.
 */
export function parseNPCMarkdown(md: string): Partial<NPC> {
  const lines = md.split('\n')
  const result: Partial<NPC> = {
    stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    features: [],
    atkDesc: '',
    weaponDesc: '',
    movement: '',
    alignment: '',
    experience: '',
    npcType: '',
    flavorText: '',
    motives: '',
  }

  // Name: first # heading
  const nameIdx = lines.findIndex(l => l.startsWith('# '))
  if (nameIdx >= 0) {
    result.name = lines[nameIdx].slice(2).trim()
    // Type: next non-empty line after name
    for (let j = nameIdx + 1; j < lines.length; j++) {
      const t = lines[j].trim()
      if (t && !t.startsWith('#')) { result.npcType = t; break }
    }
  }

  // Flavor: line starting with *...*  (not **)
  const flavorMatch = md.match(/^(\*[^*][^\n]*[^*]\*|\*[^*]\*)\s*$/m)
  if (flavorMatch) {
    result.flavorText = flavorMatch[1].replace(/^\*|\*$/g, '').trim()
  }

  // Motives: line containing **Motivos**
  const motivesMatch = md.match(/\*\*Motivos[^*]*\*\*:?\s*([^\n]+(?:\n(?!\n|##)[^\n]*)*)/)
  if (motivesMatch) {
    result.motives = motivesMatch[1].replace(/\n/g, ' ').trim()
  }

  // Stats section
  const statsSection = md.match(/## Stats\n([\s\S]*?)(?=\n##|$)/)
  if (statsSection) {
    const text = statsSection[1]
    const get = (key: string): string | undefined => {
      const re = new RegExp('(?:^|\\|)\\s*' + key + ':\\s*([^|\\n]+)', 'i')
      return text.match(re)?.[1]?.trim()
    }

    const diff = get('Difficulty'); if (diff) result.difficulty = parseInt(diff) || undefined
    const hp   = get('HP');         if (hp)   result.hp   = parseInt(hp)   || undefined
    const ac   = get('AC');         if (ac)   result.ac   = parseInt(ac)   || undefined
    const atk  = get('ATK');        if (atk)  result.atkDesc    = atk
    const wpn  = get('Weapon');     if (wpn)  result.weaponDesc = wpn
    const lv   = get('LV');         if (lv)   result.level = parseInt(lv) || undefined
    const mv   = get('MV');         if (mv)   result.movement  = mv
    const al   = get('AL');         if (al)   result.alignment = al

    const parseMod = (k: string): number => {
      const v = get(k)
      if (!v) return 0
      return parseInt(v.replace(/^\+/, '')) || 0
    }
    result.stats = {
      str: parseMod('FOR'),
      dex: parseMod('DES'),
      con: parseMod('CON'),
      int: parseMod('INT'),
      wis: parseMod('SAB'),
      cha: parseMod('CAR'),
    }

    const exp = get('Experience'); if (exp) result.experience = exp
  }

  // Features section
  const featSection = md.match(/## Features\n([\s\S]*)$/)
  if (featSection) {
    const featText = featSection[1]
    const featRegex = /\*\*([^*]+)\*\*\s*—\s*([^.\n]+\.)\s*([^\n*][\s\S]*?)(?=\n\n\*\*|\n*$)/g
    let m
    while ((m = featRegex.exec(featText)) !== null) {
      const feature: NPCFeature = {
        title: m[1].trim(),
        tag: m[2].replace(/\.$/, '').trim(),
        description: m[3].trim().replace(/\n+/g, ' '),
      }
      result.features!.push(feature)
    }
  }

  return result
}

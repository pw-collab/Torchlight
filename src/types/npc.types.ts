export interface NPCFeature {
  title: string
  tag: string
  description: string
}

export interface NPC {
  id: string
  gmId: string
  sessionId?: string
  name: string
  npcType: string
  flavorText: string
  motives: string
  difficulty?: number
  hp?: number
  ac?: number
  atkDesc: string
  weaponDesc: string
  level?: number
  movement: string
  alignment: string
  stats: { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  experience: string
  features: NPCFeature[]
  createdAt?: string
}

export interface NPCRow {
  id: string
  gm_id: string
  session_id: string | null
  name: string
  npc_type: string | null
  flavor_text: string | null
  motives: string | null
  difficulty: number | null
  hp: number | null
  ac: number | null
  atk_desc: string | null
  weapon_desc: string | null
  level: number | null
  movement: string | null
  alignment: string | null
  stats: { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  experience: string | null
  features: NPCFeature[]
  created_at: string
}

export function rowToNPC(r: NPCRow): NPC {
  return {
    id: r.id,
    gmId: r.gm_id,
    sessionId: r.session_id ?? undefined,
    name: r.name,
    npcType: r.npc_type ?? '',
    flavorText: r.flavor_text ?? '',
    motives: r.motives ?? '',
    difficulty: r.difficulty ?? undefined,
    hp: r.hp ?? undefined,
    ac: r.ac ?? undefined,
    atkDesc: r.atk_desc ?? '',
    weaponDesc: r.weapon_desc ?? '',
    level: r.level ?? undefined,
    movement: r.movement ?? '',
    alignment: r.alignment ?? '',
    stats: r.stats ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    experience: r.experience ?? '',
    features: r.features ?? [],
    createdAt: r.created_at,
  }
}

export function npcToRow(npc: Omit<NPC, 'id' | 'createdAt'>): Omit<NPCRow, 'id' | 'created_at'> {
  return {
    gm_id: npc.gmId,
    session_id: npc.sessionId ?? null,
    name: npc.name,
    npc_type: npc.npcType || null,
    flavor_text: npc.flavorText || null,
    motives: npc.motives || null,
    difficulty: npc.difficulty ?? null,
    hp: npc.hp ?? null,
    ac: npc.ac ?? null,
    atk_desc: npc.atkDesc || null,
    weapon_desc: npc.weaponDesc || null,
    level: npc.level ?? null,
    movement: npc.movement || null,
    alignment: npc.alignment || null,
    stats: npc.stats,
    experience: npc.experience || null,
    features: npc.features,
  }
}

/** Reconstroi o Markdown editável a partir de um NPC (inverso de parseNPCMarkdown). */
export function npcToMarkdown(npc: NPC): string {
  const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
  const lines: string[] = []

  lines.push(`# ${npc.name}`)
  if (npc.npcType) lines.push(npc.npcType)
  lines.push('')

  if (npc.flavorText) {
    lines.push(`*${npc.flavorText}*`)
    lines.push('')
  }

  if (npc.motives) {
    lines.push(`**Motivos & Táticas:** ${npc.motives}`)
    lines.push('')
  }

  lines.push('## Stats')

  const row1: string[] = []
  if (npc.difficulty != null) row1.push(`Difficulty: ${npc.difficulty}`)
  if (npc.hp != null) row1.push(`HP: ${npc.hp}`)
  if (npc.ac != null) row1.push(`AC: ${npc.ac}`)
  if (npc.atkDesc) row1.push(`ATK: ${npc.atkDesc}`)
  if (npc.weaponDesc) row1.push(`Weapon: ${npc.weaponDesc}`)
  if (row1.length) lines.push(row1.join(' | '))

  const row2: string[] = []
  if (npc.level != null) row2.push(`LV: ${npc.level}`)
  if (npc.movement) row2.push(`MV: ${npc.movement}`)
  if (npc.alignment) row2.push(`AL: ${npc.alignment}`)
  if (row2.length) lines.push(row2.join(' | '))

  lines.push(
    `FOR: ${fmt(npc.stats.str)} | DES: ${fmt(npc.stats.dex)} | CON: ${fmt(npc.stats.con)} | INT: ${fmt(npc.stats.int)} | SAB: ${fmt(npc.stats.wis)} | CAR: ${fmt(npc.stats.cha)}`
  )

  if (npc.experience) lines.push(`Experience: ${npc.experience}`)

  if (npc.features.length) {
    lines.push('')
    lines.push('## Features')
    lines.push('')
    for (const f of npc.features) {
      const tag = f.tag ? `${f.tag}. ` : ''
      lines.push(`**${f.title}** — ${tag}${f.description}`)
      lines.push('')
    }
  }

  return lines.join('\n').trim()
}

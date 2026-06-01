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

'use client'

import { useState } from 'react'
import type { NPC, NPCFeature } from '@/types/npc.types'
import { NPCCard } from '@/components/gm/NPCCard'

const TEMPLATE = `# Nome do NPC
Tipo — Raça, Alinhamento

*Texto de flavour aqui — personalidade em uma frase.*

**Motivos & Táticas:** Descreva comportamento em combate e motivações.

## Stats
Difficulty: 13 | HP: 18 | AC: 12 | ATK: +1 cajado | Weapon: Próximo 1d6
LV: 5 | MV: Próximo | AL: N
FOR: -1 | DES: +0 | CON: +1 | INT: +2 | SAB: +4 | CAR: +3
Experience: Lore Divino +5, Percepção +4, Medicina +3

## Features

**Fé Inabalável** — Passivo. Vantagem em saves contra medo e encantamentos de LV 4 ou inferior.

**Palavra Curativa** — Ação (Magia SAB DC 11). Cura **1d6+4** HP de um alvo visível em alcance Próximo.`

function parseNPCMarkdown(md: string): Partial<NPC> {
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

const EMPTY_NPC: Partial<NPC> = {
  name: '',
  npcType: '',
  flavorText: '',
  motives: '',
  stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  features: [],
  atkDesc: '',
  weaponDesc: '',
  movement: '',
  alignment: '',
  experience: '',
}

interface Props {
  gmId: string
  onSave: (npc: Omit<NPC, 'id' | 'createdAt'>) => Promise<void>
  onClose: () => void
}

export function NPCCreatorModal({ gmId, onSave, onClose }: Props) {
  const [md, setMd] = useState(TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parsed: Partial<NPC> = md.trim() ? parseNPCMarkdown(md) : EMPTY_NPC
  const previewNpc: NPC = {
    id: '_preview',
    gmId,
    name: parsed.name || 'Nome do NPC',
    npcType: parsed.npcType ?? '',
    flavorText: parsed.flavorText ?? '',
    motives: parsed.motives ?? '',
    difficulty: parsed.difficulty,
    hp: parsed.hp,
    ac: parsed.ac,
    atkDesc: parsed.atkDesc ?? '',
    weaponDesc: parsed.weaponDesc ?? '',
    level: parsed.level,
    movement: parsed.movement ?? '',
    alignment: parsed.alignment ?? '',
    stats: parsed.stats ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    experience: parsed.experience ?? '',
    features: parsed.features ?? [],
  }

  async function handleSave() {
    if (!parsed.name?.trim()) { setError('O nome do NPC é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...previewNpc, gmId })
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(148deg, rgba(74,54,28,.2) 0%, rgba(14,10,3,.97) 100%), #2E2210',
          border: '1px solid rgba(139,112,48,0.42)',
          borderTop: '2px solid #7A6030',
          boxShadow: '0 12px 60px rgba(0,0,0,0.85)',
          width: '100%',
          maxWidth: 920,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-light)' }}>
            ✦ Nova Ficha de NPC
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--bone-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 12, padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>

        {/* Split pane */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left: Markdown input */}
          <div style={{ flex: '0 0 48%', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(139,112,48,0.18)', padding: '14px 16px', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 2 }}>
              Markdown — cole ou edite abaixo
            </div>
            <textarea
              value={md}
              onChange={e => setMd(e.target.value)}
              style={{
                flex: 1,
                width: '100%',
                background: 'var(--ink-deep)',
                border: '1px solid rgba(139,112,48,0.28)',
                color: 'var(--parchment-light)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                padding: '10px 12px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.55,
                minHeight: 400,
              }}
            />
            <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: 'var(--bone-muted)', lineHeight: 1.5 }}>
              Dica: use <code style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--candle-amber)' }}>**negrito**</code> nas descrições de features. Stats separados por <code style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--candle-amber)' }}>|</code>.
            </div>
          </div>

          {/* Right: Live preview */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', background: 'rgba(0,0,0,0.15)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 10 }}>
              Pré-visualização
            </div>
            <NPCCard npc={previewNpc} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(139,112,48,0.18)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {error && (
            <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--blood-bright)', flex: 1 }}>
              {error}
            </span>
          )}
          <div style={{ flex: error ? 0 : 1 }} />
          <button
            onClick={onClose}
            style={{
              background: 'rgba(42,34,16,0.4)', border: '1px solid rgba(139,112,48,0.3)',
              color: 'var(--bone-muted)', fontFamily: 'var(--font-heading)', fontSize: 9,
              letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 20px', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !parsed.name?.trim()}
            style={{
              background: saving ? 'var(--parchment-mid)' : 'rgba(139,21,21,0.35)',
              border: `1px solid ${saving ? 'rgba(139,112,48,0.22)' : 'var(--blood-mid)'}`,
              color: 'var(--bone-white)', fontFamily: 'var(--font-heading)', fontSize: 9,
              letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 24px',
              cursor: saving || !parsed.name?.trim() ? 'not-allowed' : 'pointer',
              opacity: !parsed.name?.trim() ? 0.45 : 1,
            }}
          >
            {saving ? '⧖ Salvando...' : '✦ Salvar Ficha'}
          </button>
        </div>
      </div>
    </div>
  )
}

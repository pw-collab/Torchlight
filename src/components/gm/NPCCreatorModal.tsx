'use client'

import { useState } from 'react'
import type { NPC, NPCFeature } from '@/types/npc.types'
import { npcToMarkdown } from '@/types/npc.types'
import { NPCCard } from '@/components/gm/NPCCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Kbd } from '@/components/ui/kbd'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

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
  editNpc?: NPC | null
  onSave: (npc: Omit<NPC, 'id' | 'createdAt'>) => Promise<void>
  onClose: () => void
}

export function NPCCreatorModal({ gmId, editNpc, onSave, onClose }: Props) {
  const isEditing = !!editNpc
  const [md, setMd] = useState(editNpc ? npcToMarkdown(editNpc) : TEMPLATE)
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
      await onSave({ ...previewNpc, gmId, sessionId: editNpc?.sessionId })
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[90vh] max-w-[920px] flex-col overflow-hidden border-t-2 border-t-[#7A6030] p-0">
        <DialogHeader className="border-b border-[rgba(139,112,48,0.22)] px-5 py-3.5">
          <DialogTitle className="font-heading text-[10px] tracking-[0.18em] text-[var(--parchment-light)] uppercase">
            {isEditing ? '✎ Editar Ficha de NPC' : '✦ Nova Ficha de NPC'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Escreva a ficha do NPC em Markdown; a pré-visualização atualiza enquanto você digita.
          </DialogDescription>
        </DialogHeader>

        {/* Split pane */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: Markdown input */}
          <Field className="flex flex-[0_0_48%] flex-col gap-2 border-r border-[rgba(139,112,48,0.18)] px-4 py-3.5">
            <FieldLabel
              htmlFor="npc-markdown"
              className="text-muted-foreground font-heading mb-0.5 text-[8px] tracking-[0.16em] uppercase"
            >
              Markdown — cole ou edite abaixo
            </FieldLabel>
            <Textarea
              id="npc-markdown"
              value={md}
              onChange={e => setMd(e.target.value)}
              className="font-mono min-h-[400px] flex-1 resize-none border-[rgba(139,112,48,0.28)] bg-[var(--ink-deep)] text-[11px] leading-[1.55] text-[var(--parchment-light)]"
            />
            <FieldDescription className="text-muted-foreground text-[10px] leading-normal italic">
              Dica: use <Kbd className="text-[var(--candle-amber)]">**negrito**</Kbd> nas descrições
              de features. Stats separados por <Kbd className="text-[var(--candle-amber)]">|</Kbd>.
            </FieldDescription>
          </Field>

          {/* Right: Live preview */}
          <ScrollArea className="flex-1 bg-black/15">
            <div className="px-5 py-3.5">
              <div className="text-muted-foreground font-heading mb-2.5 text-[8px] tracking-[0.16em] uppercase">
                Pré-visualização
              </div>
              <NPCCard npc={previewNpc} />
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-row items-center gap-2.5 border-t border-[rgba(139,112,48,0.18)] px-5 py-3">
          {error && (
            <span className="flex-1 text-[11px] text-[var(--blood-bright)] italic">{error}</span>
          )}
          <div className={error ? 'flex-0' : 'flex-1'} />
          <Button variant="outline" onClick={onClose} className="text-muted-foreground">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !parsed.name?.trim()}>
            {saving ? <><Spinner /> Salvando…</> : isEditing ? '✎ Salvar Alterações' : '✦ Salvar Ficha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

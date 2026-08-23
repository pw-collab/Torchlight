'use client'

import { parseNPCMarkdown } from '@/lib/npcMarkdown'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { cn } from '@/lib/utils'

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
  const [activePane, setActivePane] = useState<'md' | 'preview'>('md')
  const stacked = useBreakpoint() === 'mobile'

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
    tags: editNpc?.tags ?? [],
    favorite: editNpc?.favorite ?? false,
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
      <DialogContent className="flex max-h-[90vh] max-w-[920px] flex-col overflow-hidden border-t-2 border-t-[var(--border)] p-0">
        <DialogHeader className="border-b border-[var(--border)] px-5 py-3.5">
          <DialogTitle className="font-heading text-[10px] tracking-[0.18em] text-[var(--foreground)] uppercase">
            {isEditing ? '✎ Editar Ficha de NPC' : '✦ Nova Ficha de NPC'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Escreva a ficha do NPC em Markdown; a pré-visualização atualiza enquanto você digita.
          </DialogDescription>
        </DialogHeader>

        {/* Below 768px there's no room for a side-by-side split — switch to
            a tab-per-pane layout instead. */}
        {stacked && (
          <Tabs
            value={activePane}
            onValueChange={value => setActivePane(value as 'md' | 'preview')}
            className="border-b border-[var(--border)] px-4 pt-2"
          >
            <TabsList variant="line" className="h-auto w-full justify-start gap-0 bg-transparent">
              <TabsTrigger
                value="md"
                className="font-heading text-[9px] tracking-[0.12em] uppercase"
              >
                Markdown
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="font-heading text-[9px] tracking-[0.12em] uppercase"
              >
                Pré-visualização
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Split pane — side-by-side above 768px, single active pane below */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: Markdown input */}
          {(!stacked || activePane === 'md') && (
            <Field
              className={cn(
                'flex flex-col gap-2 px-4 py-3.5',
                stacked ? 'flex-1' : 'flex-[0_0_48%] border-r border-[var(--border)]',
              )}
            >
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
                className="font-mono min-h-[400px] flex-1 resize-none border-[var(--border)] bg-[var(--background)] text-[11px] leading-[1.55] text-[var(--foreground)]"
              />
              <FieldDescription className="text-muted-foreground text-[10px] leading-normal italic">
                Dica: use <Kbd className="text-[var(--foreground)]">**negrito**</Kbd> nas descrições
                de features. Stats separados por <Kbd className="text-[var(--foreground)]">|</Kbd>.
              </FieldDescription>
            </Field>
          )}

          {/* Right: Live preview */}
          {(!stacked || activePane === 'preview') && (
            <ScrollArea className="bg-background flex-1">
              <div className="px-5 py-3.5">
                <div className="text-muted-foreground font-heading mb-2.5 text-[8px] tracking-[0.16em] uppercase">
                  Pré-visualização
                </div>
                <NPCCard npc={previewNpc} />
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-row items-center gap-2.5 border-t border-[var(--border)] px-5 py-3">
          {error && (
            <span className="flex-1 text-[11px] text-[var(--destructive)] italic">{error}</span>
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

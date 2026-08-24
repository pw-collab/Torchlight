'use client'

import { useMemo, useState } from 'react'
import type { NPC } from '@/types/npc.types'
import { parseBestiaryImport } from '@/lib/bestiary'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  onImport: (npcs: Partial<NPC>[]) => Promise<void>
  onClose: () => void
}

/**
 * Colar dez fichas de uma vez.
 *
 * O bestiário de uma campanha costuma nascer num documento — o Mestre já tem
 * os statblocks escritos em algum lugar. Antes disto, trazê-los para o app era
 * abrir o criador uma vez por monstro.
 */
export function BestiaryImportModal({ onImport, onClose }: Props) {
  const [markdown, setMarkdown] = useState('')
  const [busy, setBusy] = useState(false)

  // O que o app entendeu, contado antes de gravar: importar dez e descobrir
  // que virou um é pior do que não importar.
  const parsed = useMemo(() => parseBestiaryImport(markdown), [markdown])

  async function confirm() {
    if (parsed.length === 0) return
    setBusy(true)
    await onImport(parsed)
    setBusy(false)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-ink-spread flex w-full max-w-[640px] flex-col gap-3 p-5"
        style={{
          background: 'var(--background)',
          border: '2px solid var(--border)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-[13px] tracking-[0.12em] text-[var(--foreground)] uppercase">
            Importar fichas
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fechar"
            className="font-mono text-[13px] text-[var(--muted-foreground)]"
          >
            ✕
          </Button>
        </div>

        <p className="font-body text-[11px] leading-snug text-[var(--muted-foreground)] italic">
          Cole os statblocks em Markdown, separados por <span className="font-mono">---</span> ou
          por um título de primeiro nível. O formato é o mesmo do criador de fichas.
        </p>

        <Textarea
          value={markdown}
          onChange={e => setMarkdown(e.target.value)}
          placeholder={'# Goblin\nHumanoide pequeno\n\n## Stats\nHP: 5 | AC: 12 | ATK: 1 adaga +1 (1d4)\n\n---\n\n# Orc\n…'}
          aria-label="Statblocks em Markdown"
          className="font-mono border-border bg-secondary min-h-[260px] text-[11px]"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="font-body text-[11px] text-[var(--muted-foreground)] italic">
            {markdown.trim().length === 0
              ? 'Nada colado ainda.'
              : parsed.length === 0
                ? 'Nenhuma ficha reconhecida — falta um nome em cada bloco.'
                : `${parsed.length} ficha${parsed.length === 1 ? '' : 's'}: ${parsed.map(n => n.name).join(', ')}`}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => void confirm()}
            disabled={busy || parsed.length === 0}
            className="font-heading h-9 min-h-9 shrink-0 rounded-[1px] border-[var(--primary)] px-3 text-[9px] tracking-[0.12em] uppercase disabled:opacity-30"
          >
            {busy ? 'Importando…' : `Importar ${parsed.length || ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

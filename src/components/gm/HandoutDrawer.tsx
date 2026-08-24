'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Handout, HandoutRow } from '@/types/handout.types'
import { rowToHandout } from '@/types/handout.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface Delivery {
  title: string
  content: string
  /** Nulo entrega à mesa inteira; uma lista entrega a esses personagens. */
  characterIds: string[] | null
}

interface Props {
  gmId: string
  seats: { id: string; name: string }[]
  onDeliver: (delivery: Delivery) => void
  onClose: () => void
}

const CHIP =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.1em] uppercase'

/** Um rascunho novo é o mesmo objeto vazio, e não uma linha do banco. */
const BLANK: Handout = { id: '', gmId: '', title: '', content: '', createdAt: '' }

/**
 * A gaveta do Mestre, e o gesto de entregar (§6.8).
 *
 * Metade disto já existia: itens do tipo `document` com Markdown e um leitor
 * paginado. Faltava o empurrão — o Mestre escreve a carta na preparação,
 * guarda, e na hora certa entrega a um personagem ou à mesa inteira, e ela
 * abre na tela de quem recebeu.
 *
 * A gaveta é privada por RLS: o jogador nunca a lê. O que ele recebe viaja no
 * próprio evento, com o texto junto — o que foi revelado continua legível
 * mesmo que o original seja apagado depois.
 */
export function HandoutDrawer({ gmId, seats, onDeliver, onClose }: Props) {
  const [handouts, setHandouts] = useState<Handout[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Handout>(BLANK)
  const [saving, setSaving] = useState(false)
  const [targets, setTargets] = useState<string[]>([])

  // Ninguém marcado quer dizer a mesa inteira — o caso comum é a carta lida em
  // voz alta, e não o bilhete passado por baixo da mesa.
  const everyone = targets.length === 0
  const ready = draft.title.trim().length > 0 && draft.content.trim().length > 0

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('handouts')
      .select('*')
      .eq('gm_id', gmId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        setHandouts(((data ?? []) as HandoutRow[]).map(rowToHandout))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [gmId])

  /** Guardar é opcional: dá para escrever e entregar sem deixar cópia. */
  async function save() {
    if (!ready) return
    setSaving(true)
    const supabase = createClient()
    const fields = { title: draft.title.trim(), content: draft.content }

    if (draft.id) {
      const { data } = await supabase
        .from('handouts')
        .update(fields)
        .eq('id', draft.id)
        .select()
        .single()
      if (data) {
        const saved = rowToHandout(data as HandoutRow)
        setHandouts(prev => prev.map(h => (h.id === saved.id ? saved : h)))
        setDraft(saved)
      }
    } else {
      const { data } = await supabase
        .from('handouts')
        .insert({ gm_id: gmId, ...fields })
        .select()
        .single()
      if (data) {
        const saved = rowToHandout(data as HandoutRow)
        setHandouts(prev => [saved, ...prev])
        setDraft(saved)
      }
    }
    setSaving(false)
  }

  async function remove() {
    if (!draft.id) return
    const ok = window.confirm(`Descartar "${draft.title}"? O que já foi entregue continua na mesa.`)
    if (!ok) return
    const supabase = createClient()
    await supabase.from('handouts').delete().eq('id', draft.id)
    setHandouts(prev => prev.filter(h => h.id !== draft.id))
    setDraft(BLANK)
  }

  function deliver() {
    if (!ready) return
    onDeliver({
      title: draft.title.trim(),
      content: draft.content,
      characterIds: everyone ? null : targets,
    })
    onClose()
  }

  function toggleTarget(id: string) {
    setTargets(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]))
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-ink-spread flex max-h-[92vh] w-full max-w-[760px] flex-col gap-3 overflow-y-auto p-5"
        style={{
          background: 'var(--background)',
          border: '2px solid var(--border)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-[13px] tracking-[0.12em] text-[var(--foreground)] uppercase">
            📖 Entregar um documento
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

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* A gaveta */}
          <div className="flex shrink-0 flex-col gap-1 sm:w-[190px]">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                Guardados
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDraft(BLANK)}
                className="font-heading h-7 min-h-7 px-1.5 text-[8px] tracking-[0.1em] text-[var(--muted-foreground)] uppercase"
              >
                + Novo
              </Button>
            </div>

            <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto sm:max-h-[380px]">
              {loading && (
                <span className="font-body text-[11px] text-[var(--muted-foreground)] italic">
                  Abrindo a gaveta…
                </span>
              )}
              {!loading && handouts.length === 0 && (
                <span className="font-body text-[11px] leading-snug text-[var(--muted-foreground)] italic">
                  A gaveta está vazia. Escreva ao lado — guardar é opcional.
                </span>
              )}
              {handouts.map(handout => (
                <button
                  key={handout.id}
                  type="button"
                  onClick={() => setDraft(handout)}
                  className={cn(
                    'font-body truncate px-2 py-1.5 text-left text-[11px]',
                    draft.id === handout.id
                      ? 'border border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
                      : 'border border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
                  )}
                >
                  {handout.title}
                </button>
              ))}
            </div>
          </div>

          {/* O texto */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input
              type="text"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value.slice(0, 80) }))}
              placeholder="A carta de Lorde Vhalen"
              aria-label="Título do documento"
              className="font-heading border-border bg-secondary h-9 text-[12px] tracking-[0.06em]"
            />
            <Textarea
              value={draft.content}
              onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
              placeholder={'# A carta\n\nEscreva em **Markdown**. O leitor pagina sozinho.'}
              aria-label="Conteúdo em Markdown"
              className="font-mono border-border bg-secondary min-h-[200px] text-[11px] sm:min-h-[300px]"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void save()}
                disabled={saving || !ready}
                title="Deixa uma cópia na gaveta para as próximas sessões"
                className={cn(CHIP, 'flex-1 border-[var(--border)] disabled:opacity-30')}
              >
                {saving ? 'Guardando…' : draft.id ? 'Salvar' : 'Guardar na gaveta'}
              </Button>
              {draft.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void remove()}
                  className={cn(CHIP, 'shrink-0 border-[var(--destructive)] text-[var(--destructive)]')}
                >
                  Descartar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* A entrega */}
        <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3">
          <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
            Entregar a
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTargets([])}
              className={cn(
                CHIP,
                everyone
                  ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
                  : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
              )}
            >
              A mesa
            </Button>
            {seats.map(seat => (
              <Button
                key={seat.id}
                type="button"
                variant="outline"
                onClick={() => toggleTarget(seat.id)}
                className={cn(
                  CHIP,
                  targets.includes(seat.id)
                    ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
                )}
              >
                {seat.name}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="hollow"
            onClick={deliver}
            disabled={!ready || seats.length === 0}
            title={
              seats.length === 0
                ? 'Ninguém na mesa para receber'
                : everyone
                  ? 'Abre na tela de todo mundo'
                  : 'Abre só na tela de quem foi marcado'
            }
            className="font-heading bg-primary text-primary-foreground h-9 min-h-9 text-[9px] font-bold tracking-[0.12em] uppercase disabled:opacity-35"
          >
            {everyone ? 'Entregar à mesa' : `Entregar a ${targets.length}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

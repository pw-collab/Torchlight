'use client'

import { useState } from 'react'
import type { Stat } from '@/types/class.types'
import { STAT_KEYS, STAT_LABELS } from '@/data/stats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface PromptRequest {
  attribute: Stat | null
  dc: number
  label: string
  secret: boolean
  characterIds: string[]
}

interface Props {
  seats: { id: string; name: string }[]
  onSend: (request: PromptRequest) => void
  onClose: () => void
  busy?: boolean
}

const CHIP =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.1em] uppercase'

/**
 * "Todos, CON DC 12 contra o gás."
 *
 * O núcleo do modo interativo: o Mestre pede, o jogador responde, o resultado
 * volta. Em lote ou individual; aberta, e a mesa inteira vê o resultado, ou em
 * segredo, e só quem rolou e o Mestre veem.
 *
 * Não há tabela de pendências: o pedido é uma linha do log e a resposta é
 * outra, amarradas pelo mesmo `promptId`.
 */
export function PromptComposer({ seats, onSend, onClose, busy }: Props) {
  const [attribute, setAttribute] = useState<Stat | null>('con')
  const [dc, setDc] = useState('12')
  const [label, setLabel] = useState('')
  const [secret, setSecret] = useState(false)
  const [targets, setTargets] = useState<string[]>([])

  // Ninguém marcado quer dizer a mesa inteira — é o caso comum, e forçar seis
  // toques antes de pedir um teste de grupo seria trabalho à toa.
  const everyone = targets.length === 0
  const parsedDc = parseInt(dc, 10)
  const validDc = Number.isFinite(parsedDc) && parsedDc > 0

  function toggleTarget(id: string) {
    setTargets(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]))
  }

  function send() {
    if (!validDc || seats.length === 0) return
    onSend({
      attribute,
      dc: parsedDc,
      label: label.trim(),
      secret,
      characterIds: everyone ? seats.map(s => s.id) : targets,
    })
    setLabel('')
    setTargets([])
    onClose()
  }

  if (seats.length === 0) return null

  return (
    <div
      className="worn-border animate-ink-spread flex w-full flex-col gap-2.5 p-3"
      style={{ background: 'var(--card)', border: '1px solid var(--primary)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          Pedir uma rolagem
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Fechar"
          className="font-mono text-xs text-[var(--muted-foreground)]"
        >
          ✕
        </Button>
      </div>

      {/* Atributo */}
      <div className="flex flex-wrap items-center gap-1">
        {STAT_KEYS.map(key => (
          <Button
            key={key}
            type="button"
            variant="outline"
            onClick={() => setAttribute(key)}
            className={cn(
              CHIP,
              attribute === key
                ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
                : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
            )}
          >
            {STAT_LABELS[key]}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setAttribute(null)}
          title="Um d20 cru, sem atributo"
          className={cn(
            CHIP,
            attribute === null
              ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
              : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
          )}
        >
          d20
        </Button>
      </div>

      {/* DC e motivo */}
      <div className="flex items-center gap-2">
        <Label htmlFor="prompt-dc" className="font-heading shrink-0 text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          DC
        </Label>
        <Input
          id="prompt-dc"
          type="text"
          inputMode="numeric"
          value={dc}
          onChange={e => setDc(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          className="font-mono border-border bg-secondary h-9 w-12 shrink-0 px-1 text-center text-[13px]"
        />
        <Input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value.slice(0, 60))}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="contra o gás…"
          aria-label="Motivo da rolagem"
          className="font-body border-border bg-secondary h-9 flex-1 text-[12px] italic"
        />
      </div>

      {/* Alvos */}
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
          Todos
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

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSecret(s => !s)}
          title={secret ? 'Só quem rolar e você veem o resultado' : 'A mesa inteira vê o resultado'}
          className={cn(
            CHIP,
            'flex-1',
            secret
              ? 'border-[var(--muted-foreground)] bg-[var(--muted)] text-[var(--foreground)]'
              : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
          )}
        >
          {secret ? '🜃 Em segredo' : '👁 Aberta'}
        </Button>
        <Button
          type="button"
          variant="hollow"
          onClick={send}
          disabled={busy || !validDc}
          className="font-heading bg-primary text-primary-foreground h-8 min-h-8 flex-1 text-[9px] font-bold tracking-[0.12em] uppercase disabled:opacity-35"
        >
          Enviar
        </Button>
      </div>
    </div>
  )
}

'use client'

import type { SessionEvent } from '@/types/session.types'
import { handoutTitle } from '@/lib/handouts'

interface Props {
  /** O que foi entregue a esta ficha, do mais recente para o mais antigo. */
  handouts: SessionEvent[]
  onOpen: (handout: SessionEvent) => void
}

/**
 * A pilha de papéis ao lado da ficha (§6.8).
 *
 * O documento abre sozinho quando chega, mas fecha-se para jogar — e depois
 * alguém pergunta "o que dizia a carta mesmo?". Daí a prateleira: o que a mesa
 * já viu continua a um toque, na ordem em que chegou.
 */
export function HandoutShelf({ handouts, onOpen }: Props) {
  if (handouts.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {handouts.map(handout => (
        <button
          key={handout.id}
          type="button"
          onClick={() => onOpen(handout)}
          title={`Reler "${handoutTitle(handout)}"`}
          className="font-heading inline-flex cursor-pointer items-center gap-1 border px-2 py-[3px] text-[8px] tracking-[0.12em] uppercase transition-opacity hover:opacity-80"
          style={{
            color: 'var(--chart-2)',
            background: 'color-mix(in oklch, var(--chart-2), transparent 88%)',
            borderColor: 'color-mix(in oklch, var(--chart-2), transparent 60%)',
          }}
        >
          <span aria-hidden>📖</span>
          {handoutTitle(handout)}
        </button>
      ))}
    </div>
  )
}

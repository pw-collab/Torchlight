'use client'

import { motion } from 'framer-motion'
import type { SessionEvent, PromptPayload } from '@/types/session.types'
import { STAT_FULL, isStat } from '@/data/stats'
import { Button } from '@/components/ui/button'

interface Props {
  prompts: SessionEvent[]
  onAnswer: (prompt: SessionEvent) => void
}

/**
 * O Mestre pediu, e a ficha responde.
 *
 * "Todos, CON DC 12 contra o gás" chega aqui como um cartão com um botão. O
 * jogador toca, o motor de dados 3D roda como em qualquer outra rolagem, e o
 * resultado volta para o feed do Mestre já comparado ao DC — é isso que faz os
 * dois lados do app conversarem.
 *
 * Fica no fluxo da página, no topo do conteúdo, em vez de flutuando: um pedido
 * que a mesa está esperando não pode ser um aviso que some sozinho.
 */
export function PromptCard({ prompts, onAnswer }: Props) {
  if (prompts.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {prompts.map(prompt => {
        const p = prompt.payload as PromptPayload
        const attribute = isStat(p.attribute) ? STAT_FULL[p.attribute] : null

        return (
          <motion.div
            key={prompt.id}
            className="worn-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'color-mix(in oklch, var(--primary), transparent 88%)',
              border: '1px solid var(--primary)',
              borderLeftWidth: 3,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span aria-hidden className="animate-flicker text-[18px] leading-none">
              ❔
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                {prompt.actorName} pede uma rolagem
                {p.secret && ' · em segredo'}
              </span>
              <span className="font-heading text-[13px] leading-tight text-[var(--foreground)]">
                {attribute ? `${attribute} ` : ''}DC {p.dc}
              </span>
              {p.label && (
                <span className="font-body text-[11px] leading-snug text-[var(--muted-foreground)] italic">
                  {p.label}
                </span>
              )}
            </span>

            <Button
              type="button"
              variant="hollow"
              onClick={() => onAnswer(prompt)}
              className="font-heading bg-primary text-primary-foreground h-11 shrink-0 px-4 text-[11px] font-bold tracking-[0.14em] uppercase"
            >
              Rolar
            </Button>
          </motion.div>
        )
      })}
    </div>
  )
}

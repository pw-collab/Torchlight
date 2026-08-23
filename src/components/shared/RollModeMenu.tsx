'use client'

import type { ReactNode } from 'react'
import type { RollMode } from '@/lib/dice'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/** As três formas de levar um d20 à mesa, na ordem em que se pensa nelas. */
export const ROLL_MODES: { id: RollMode; label: string; className: string }[] = [
  { id: 'normal', label: 'Normal', className: 'text-[var(--foreground)]' },
  { id: 'advantage', label: '✦ Vantagem', className: 'text-[var(--chart-2)]' },
  { id: 'disadvantage', label: '✕ Desvantagem', className: 'text-[var(--destructive)]' },
]

interface Props {
  /** O que se clica: o card do atributo, o botão de ataque, o "Conjurar". */
  children: ReactNode
  /** Para o leitor de tela: "Rolar Ataque: Espada longa". */
  label: string
  onRoll: (mode: RollMode) => void
  align?: 'start' | 'center' | 'end'
  disabled?: boolean
  className?: string
}

/**
 * Escolher entre normal, vantagem e desvantagem — em qualquer rolagem.
 *
 * O bloco de atributos já fazia isso, e só ele: ataque, conjuração, técnicas de
 * classe e iniciativa rolavam sempre normal, e a mesa resolvia por fora ("rola
 * de novo e pega o menor"). O idioma agora é um só e vale para todo teste de
 * d20 — o mesmo gesto, o mesmo menu, no mesmo lugar.
 *
 * Vale para o d20; dano e recuperação continuam sem modo, porque "joga dois,
 * guarda um" não quer dizer nada num punhado de dados de dano.
 */
export function RollModeMenu({ children, label, onRoll, align = 'center', disabled, className }: Props) {
  if (disabled) return <>{children}</>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className={cn('group/roll cursor-pointer outline-none', className)}
      >
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={4}
        className="border-t-primary w-auto min-w-[130px] border-t-4 p-0"
      >
        {ROLL_MODES.map(mode => (
          <DropdownMenuItem
            key={mode.id}
            onClick={() => onRoll(mode.id)}
            className={cn(
              'px-3.5 py-2.5 text-[13px] italic not-last:border-b not-last:border-[var(--border)]',
              mode.className,
            )}
          >
            {mode.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

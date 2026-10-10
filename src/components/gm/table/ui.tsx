'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * As peças miúdas da mesa do Mestre: o rótulo de seção, os botões em pílula e
 * o ladrilho do menu de comandos. Ficam juntas para a tela inteira falar a
 * mesma língua — a fila de turnos, os cards e o menu.
 */

export const LABEL =
  'font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase'

export const PILL =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase'

export const CHIP =
  'font-heading h-7 min-h-7 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase'

export const FIELD =
  'font-mono border-border bg-secondary h-9 px-2 text-center text-[13px]'

type Tone = 'default' | 'primary' | 'danger' | 'heal' | 'gold'

const TONE: Record<Tone, string> = {
  default: 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
  primary: 'border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary),transparent_88%)] hover:bg-[color-mix(in_oklch,var(--primary),transparent_80%)]',
  danger: 'border-[var(--destructive)] bg-[color-mix(in_oklch,var(--destructive),transparent_90%)] hover:bg-[color-mix(in_oklch,var(--destructive),transparent_82%)]',
  heal: 'border-[var(--chart-2)] bg-[color-mix(in_oklch,var(--chart-2),transparent_90%)] hover:bg-[color-mix(in_oklch,var(--chart-2),transparent_82%)]',
  gold: 'border-[var(--chart-1)] bg-[color-mix(in_oklch,var(--chart-1),transparent_88%)] hover:bg-[color-mix(in_oklch,var(--chart-1),transparent_80%)]',
}

/**
 * Um comando do menu, como num RPG de turno: ícone grande, nome curto e, por
 * baixo, o que ele faz agora ("Goblin 2: +1 · 1d6"). `highlight` acende o que
 * a regra está pedindo — a moral depois de metade cair, a vez de quem morre.
 */
export function CommandTile({
  icon, label, hint, onClick, disabled, tone = 'default', highlight, title,
}: {
  icon: ReactNode
  label: string
  hint?: ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: Tone
  highlight?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'tactile flex min-h-[68px] cursor-pointer flex-col items-start justify-between gap-1 border px-3 py-2 text-left',
        'transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/50 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-30',
        TONE[tone],
        highlight && 'animate-flicker',
      )}
    >
      <span aria-hidden className="text-[18px] leading-none">{icon}</span>
      <span className="font-heading text-[9.5px] font-bold tracking-[0.14em] text-[var(--foreground)] uppercase">
        {label}
      </span>
      {hint && (
        <span className="font-body text-[10px] leading-tight text-[var(--muted-foreground)] italic">
          {hint}
        </span>
      )}
    </button>
  )
}

/** A grade de comandos: dois por linha no celular, até quatro no desktop. */
export function CommandGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4">{children}</div>
}

/** Um comando aberto: o formulário dele no lugar do menu, com a volta à mão. */
export function SubView({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="animate-ink-spread flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="font-heading cursor-pointer text-[9px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase hover:text-[var(--foreground)]"
        >
          ← Voltar
        </button>
        <span className="font-heading text-[11px] tracking-[0.1em] text-[var(--foreground)] uppercase">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

/** A barra de vida dos cards e da fila: verde, depois âmbar, depois sangue. */
export function HpBar({ current, max, thin }: { current: number; max: number; thin?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const color = pct > 50 ? 'var(--chart-2)' : pct > 25 ? 'var(--chart-1)' : 'var(--destructive)'
  return (
    <span
      aria-hidden
      className={cn('block w-full overflow-hidden bg-[var(--muted)]', thin ? 'h-[3px]' : 'h-[5px]')}
    >
      <span
        className="block h-full transition-[width] duration-[400ms]"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}` }}
      />
    </span>
  )
}

/** Um número digitado, ou nada — o campo vazio não vira zero. */
export function parseAmount(text: string): number {
  const n = Math.abs(parseInt(text, 10))
  return Number.isFinite(n) ? n : 0
}

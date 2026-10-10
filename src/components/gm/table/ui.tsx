'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * As peças miúdas da mesa do Mestre: rótulos, pílulas e o botão de
 * habilidade do painel de baixo. O visual mora em `.dd-*` (globals.css);
 * aqui fica o comportamento.
 */

export const LABEL =
  'font-heading text-[9px] font-bold tracking-[0.16em] text-[var(--muted-foreground)] uppercase'

export const PILL =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[9px] font-bold tracking-[0.12em] uppercase'

export const CHIP =
  'font-heading h-7 min-h-7 rounded-[1px] px-2 text-[9px] font-bold tracking-[0.08em] uppercase'

export const FIELD =
  'font-mono border-border bg-secondary h-9 px-2 text-center text-[13px]'

type Tone = 'default' | 'primary' | 'danger' | 'heal' | 'gold'

const TONE: Record<Tone, string> = {
  default: '',
  primary: 'dd-skill--gold',
  danger: 'dd-skill--danger',
  heal: 'dd-skill--heal',
  gold: 'dd-skill--gold',
}

/** Quem está sob o cursor no menu — a linha de baixo conta o que ele faz. */
const HintContext = createContext<(hint: { label: string; text: string } | null) => void>(() => {})

/**
 * Um comando como habilidade de RPG de turno: o ícone pintado de osso e o
 * nome por baixo. O que ele faz agora ("+1 · 1d6, clique no alvo") aparece na
 * linha de descrição ao passar o mouse ou focar — e vai junto no nome
 * acessível, para quem lê a tela. `highlight` acende o que a regra está
 * pedindo: a moral depois de metade cair, a vez de quem morre.
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
  const setHint = useContext(HintContext)
  const text = [typeof hint === 'string' ? hint : '', title ?? ''].filter(Boolean).join(' — ')
  const show = () => setHint(text ? { label, text } : null)
  const hide = () => setHint(null)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={text || undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={cn('dd-skill', TONE[tone], highlight && !disabled && 'is-hot')}
    >
      <span aria-hidden className="dd-skill__icon">{icon}</span>
      <span className="dd-skill__label">{label}</span>
      {text && <span className="sr-only">{text}</span>}
    </button>
  )
}

/**
 * A grade de habilidades e, por baixo, a linha que descreve a que está sob o
 * cursor. Sem nada em foco, ela diz `idle` — o que vale saber agora.
 */
export function CommandGrid({ children, idle }: { children: ReactNode; idle?: ReactNode }) {
  const [hint, setHint] = useState<{ label: string; text: string } | null>(null)
  return (
    <HintContext.Provider value={setHint}>
      <div className="flex flex-col gap-3">
        <div className="dd-skills">{children}</div>
        <p className="dd-hintline m-0" aria-live="polite">
          {hint ? (
            <>
              <b>{hint.label}</b>
              {hint.text}
            </>
          ) : (
            idle ?? 'Passe o mouse num comando para ver o que ele faz.'
          )}
        </p>
      </div>
    </HintContext.Provider>
  )
}

/** Um comando aberto: o formulário dele no lugar do menu, com a volta à mão. */
export function SubView({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="animate-ink-spread flex flex-col gap-3">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-2">
        <button type="button" onClick={onBack} className="dd-btn dd-btn--sm">
          ← Voltar
        </button>
        <span className="dd-title text-[12px]">{title}</span>
      </div>
      {children}
    </div>
  )
}

/** A vida em gomos de sangue. */
export function HpBar({ current, max, thin }: { current: number; max: number; thin?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  return (
    <span aria-hidden className={cn('dd-hp block', thin && 'dd-hp--thin')}>
      <span style={{ width: `${pct}%` }} />
    </span>
  )
}

/** Um número digitado, ou nada — o campo vazio não vira zero. */
export function parseAmount(text: string): number {
  const n = Math.abs(parseInt(text, 10))
  return Number.isFinite(n) ? n : 0
}

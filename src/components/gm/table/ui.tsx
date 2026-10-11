'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * As peças miúdas da mesa do Mestre: rótulos, pílulas, o comando do bloco de
 * ações e a barra de vida. O visual mora em `.gm-*` (globals.css), nos tokens
 * da app; aqui fica o comportamento.
 */

export const LABEL =
  'font-heading text-[10px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase'

export const CHIP =
  'font-heading h-8 min-h-8 px-2.5 text-[10px] tracking-[0.08em] uppercase'

export const FIELD =
  'font-mono border-input-border bg-secondary h-9 px-2 text-center text-[13px]'

/** O estado marcado de um botão de escolha: a borda vermelha sobre o --input. */
export const PRESSED = 'border-[var(--primary-text)] bg-[var(--input)] text-[var(--foreground)]'

/** O botão principal de um formulário aberto: o vermelho cheio, a largura toda. */
export const SUBMIT = 'h-11 w-full text-[11px] tracking-[0.12em] disabled:opacity-40'

type Tone = 'default' | 'primary' | 'danger'

/** Quem está sob o cursor no menu — a linha de baixo conta o que ele faz. */
const HintContext = createContext<(hint: { label: string; text: string } | null) => void>(() => {})

/**
 * Um comando: o ícone e o nome por baixo, num quadrado como os da trilha de
 * abas da ficha. O que ele faz agora ("+1 · 1d6, clique no alvo") aparece na
 * linha de descrição ao passar o mouse ou focar — e vai junto no nome
 * acessível, para quem lê a tela.
 *
 * `primary` é a ação da vez (encerrar, assumir), no vermelho cheio da aba
 * ativa; `danger` pinta o ícone de sangue. `highlight` acende o que a regra
 * está pedindo: a moral depois de metade cair, a vez de quem morre.
 */
export function CommandTile({
  icon, label, hint, onClick, disabled, tone = 'default', highlight, title,
}: {
  icon: IconSvgElement
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
      className={cn(
        'gm-command',
        tone === 'primary' && 'gm-command--primary',
        tone === 'danger' && 'gm-command--danger',
        highlight && !disabled && 'is-hot',
      )}
    >
      <HugeiconsIcon icon={icon} size={22} strokeWidth={1.5} aria-hidden className="gm-command__icon" />
      <span className="gm-command__label">{label}</span>
      {text && <span className="sr-only">{text}</span>}
    </button>
  )
}

/**
 * A grade de comandos e, por baixo, a linha que descreve o que está sob o
 * cursor. Sem nada em foco, ela diz `idle` — o que vale saber agora.
 */
export function CommandGrid({ children, idle }: { children: ReactNode; idle?: ReactNode }) {
  const [hint, setHint] = useState<{ label: string; text: string } | null>(null)
  return (
    <HintContext.Provider value={setHint}>
      <div className="flex flex-col gap-3">
        <div className="gm-commands">{children}</div>
        <p className="gm-hint" aria-live="polite">
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
    <div className="animate-mist-rise flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label="Voltar aos comandos" title="Voltar">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.75} />
        </Button>
        <span className="font-heading min-w-0 truncate text-[13px] tracking-[0.1em] text-[var(--foreground)] uppercase">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

/** A vida como nos vitais da ficha: vermelho sobre o trilho, o número por cima. */
export function HpBar({ current, max, label = true }: { current: number; max: number; label?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  return (
    <span aria-hidden className="gm-hp">
      <span className="gm-hp__fill" style={{ width: `${pct}%` }} />
      <span className="gm-hp__text">
        {label && <small>PV</small>}
        {current}/{max}
      </span>
    </span>
  )
}

/** Um número digitado, ou nada — o campo vazio não vira zero. */
export function parseAmount(text: string): number {
  const n = Math.abs(parseInt(text, 10))
  return Number.isFinite(n) ? n : 0
}

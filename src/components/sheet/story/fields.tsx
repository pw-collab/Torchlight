'use client'

import {
  useCallback, useEffect, useRef, useState,
  type ClipboardEventHandler, type KeyboardEventHandler, type ReactNode, type Ref,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Edit03Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/*
 * As peças de edição da aba História. Tudo salva sozinho, ao sair do campo,
 * como o resto da ficha: o selo "Selado" confirma. Cada campo guarda o que
 * está sendo digitado num estado próprio, então o eco do salvamento não
 * desfaz o que o jogador ainda está escrevendo.
 */

/**
 * Controles sobre --background, um passo mais escuros que os blocos que os
 * agrupam: um campo nunca some dentro do bloco.
 */
export const INPUT_CLASS =
  'h-auto w-full rounded-[1px] border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-[13px] leading-[1.5] text-[var(--foreground)]'

/** O rótulo de um campo, no tamanho dos rótulos da ficha. */
export function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <label htmlFor={htmlFor} className="type-label text-muted-foreground font-semibold">
        {children}
      </label>
      {hint && <span className="text-muted-foreground text-[11px] leading-snug italic">{hint}</span>}
    </div>
  )
}

/**
 * Textarea que cresce com o texto. A ficha é muito mais lida do que
 * preenchida, e uma janela fixa vira três linhas com barra de rolagem.
 * Mede de novo quando o texto muda e quando a largura muda.
 */
export function AutoTextarea({
  ref: outerRef, id, value, onChange, onBlur, onKeyDown, onPaste, placeholder, ariaLabel, minRows = 3, maxLength, className,
}: {
  ref?: Ref<HTMLTextAreaElement>
  id?: string
  value: string
  onChange: (v: string) => void
  onBlur?: (v: string) => void
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>
  placeholder?: string
  ariaLabel?: string
  minRows?: number
  maxLength?: number
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const setRef = useCallback((el: HTMLTextAreaElement | null) => {
    ref.current = el
    if (typeof outerRef === 'function') outerRef(el)
    else if (outerRef) outerRef.current = el
  }, [outerRef])

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [])

  useEffect(measure, [value, measure])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      measure()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  return (
    <Textarea
      ref={setRef}
      id={id}
      rows={minRows}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={e => onBlur?.(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={maxLength}
      className={cn(INPUT_CLASS, 'min-h-0 resize-none overflow-hidden', className)}
    />
  )
}

/**
 * Um campo de texto da história: guarda o que se digita e salva ao sair,
 * só quando mudou.
 */
export function TextField({
  id, label, hint, value, onSave, placeholder, multiline = false, minRows = 3, maxLength,
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  value: string
  onSave: (value: string) => void
  placeholder?: string
  multiline?: boolean
  minRows?: number
  maxLength?: number
}) {
  const [draft, setDraft] = useState(value)
  const saved = useRef(value)

  function persist(next: string) {
    if (next === saved.current) return
    saved.current = next
    onSave(next)
  }

  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>{label}</FieldLabel>
      {multiline ? (
        <AutoTextarea
          id={id}
          value={draft}
          onChange={setDraft}
          onBlur={persist}
          placeholder={placeholder}
          minRows={minRows}
          maxLength={maxLength}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => persist(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength ?? 120}
          className={INPUT_CLASS}
        />
      )}
    </div>
  )
}

export function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-7 w-7 shrink-0 text-[12px] leading-none text-[var(--muted-foreground)] transition-colors duration-[160ms] hover:bg-transparent hover:text-[var(--destructive)]"
    >
      ✕
    </Button>
  )
}

/** "+ Adicionar …": o botão discreto no pé de uma lista. */
export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'text-muted-foreground h-auto self-start gap-1.5 px-1.5 py-1 text-[10.5px] tracking-[0.12em]',
        'hover:text-foreground hover:bg-transparent transition-colors duration-[160ms]',
      )}
    >
      <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
      {children}
    </Button>
  )
}

/**
 * Alterna um capítulo entre leitura e edição. Na edição vira o "Pronto" em
 * brasa: a ação que fecha o editor e devolve a página de leitura.
 */
export function EditToggle({ editing, onClick, chapter }: { editing: boolean; onClick: () => void; chapter: string }) {
  return (
    <Button
      type="button"
      variant={editing ? 'default' : 'outline'}
      onClick={onClick}
      aria-label={editing ? `Concluir edição: ${chapter}` : `Editar: ${chapter}`}
      // O hover padrão escurece a brasa e o texto escuro cai abaixo de 4,5:1;
      // aqui ela clareia, e o contraste sobe.
      className={cn(
        'h-8 shrink-0 gap-1.5 rounded-[1px] px-2.5 text-[10px] tracking-[0.14em]',
        editing && 'hover:bg-[color-mix(in_oklch,var(--primary),white_14%)]',
      )}
    >
      <HugeiconsIcon icon={editing ? Tick02Icon : Edit03Icon} size={14} strokeWidth={2} />
      {editing ? 'Pronto' : 'Editar'}
    </Button>
  )
}

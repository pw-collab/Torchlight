'use client'

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { InlineMarkdown } from '@/components/sheet/story/StoryMarkdown'
import { AddButton, AutoTextarea, RemoveButton } from '@/components/sheet/story/fields'
import { cleanBullets, newId, splitPastedBullets } from '@/lib/story'

/** Os bullets na leitura: losango em brasa, negrito e itálico permitidos. */
export function BulletList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className ? `story-list ${className}` : 'story-list'}>
      {items.map((item, i) => (
        <li key={i}><InlineMarkdown>{item}</InlineMarkdown></li>
      ))}
    </ul>
  )
}

interface Row {
  id: string
  text: string
}

/**
 * Bullets de uma linha cada. O campo quebra na tela para caber o item
 * inteiro, mas não aceita quebra de linha: Enter abre o bullet seguinte,
 * Backspace num bullet vazio o apaga, Alt+↑/↓ muda a ordem. Colar um
 * texto com vários itens (de um PDF, por exemplo) cria um bullet por item.
 */
export function BulletEditor({
  items, onSave, label, placeholder, addLabel = 'Adicionar item',
}: {
  items: string[]
  onSave: (items: string[]) => void
  /** Dá nome à lista para leitores de tela: "Segredos". */
  label: string
  placeholder?: string
  addLabel?: string
}) {
  const [rows, setRows] = useState<Row[]>(() => (items.length ? items : ['']).map(text => ({ id: newId(), text })))
  const saved = useRef(JSON.stringify(cleanBullets(items)))
  const fields = useRef(new Map<string, HTMLTextAreaElement>())
  const focusNext = useRef<{ id: string; caret?: number } | null>(null)

  // Depois de criar, apagar ou mover um item, o foco vai para onde o
  // jogador espera continuar digitando.
  useEffect(() => {
    const target = focusNext.current
    if (!target) return
    focusNext.current = null
    const el = fields.current.get(target.id)
    if (!el) return
    el.focus()
    const caret = target.caret ?? el.value.length
    el.setSelectionRange(caret, caret)
  })

  function persist(next: Row[]) {
    const clean = cleanBullets(next.map(r => r.text))
    const key = JSON.stringify(clean)
    if (key === saved.current) return
    saved.current = key
    onSave(clean)
  }

  function commit(next: Row[]) {
    setRows(next)
    persist(next)
  }

  function insertAfter(index: number, texts: string[] = ['']) {
    const added = texts.map(text => ({ id: newId(), text }))
    const next = [...rows.slice(0, index + 1), ...added, ...rows.slice(index + 1)]
    focusNext.current = { id: added[added.length - 1].id }
    if (texts.some(t => t.trim())) commit(next)
    else setRows(next)
  }

  function remove(index: number, moveFocus: boolean) {
    let next = rows.filter((_, i) => i !== index)
    if (next.length === 0) next = [{ id: newId(), text: '' }]
    if (moveFocus) focusNext.current = { id: next[Math.max(0, index - 1)].id }
    commit(next)
  }

  function move(index: number, by: -1 | 1) {
    const to = index + by
    if (to < 0 || to >= rows.length) return
    const next = [...rows]
    ;[next[index], next[to]] = [next[to], next[index]]
    const el = fields.current.get(rows[index].id)
    focusNext.current = { id: rows[index].id, caret: el?.selectionStart ?? undefined }
    commit(next)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      insertAfter(index)
    } else if (e.key === 'Backspace' && e.currentTarget.value === '' && rows.length > 1) {
      e.preventDefault()
      remove(index, true)
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      move(index, e.key === 'ArrowUp' ? -1 : 1)
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>, index: number) {
    const pasted = e.clipboardData.getData('text/plain')
    if (!/[\r\n]/.test(pasted)) return
    const pieces = splitPastedBullets(pasted)
    if (pieces.length === 0) return
    e.preventDefault()
    const current = rows[index]
    if (current.text.trim()) {
      insertAfter(index, pieces)
      return
    }
    // O bullet vazio onde se colou recebe o primeiro item.
    const added = pieces.slice(1).map(text => ({ id: newId(), text }))
    const next = [...rows.slice(0, index), { ...current, text: pieces[0] }, ...added, ...rows.slice(index + 1)]
    focusNext.current = { id: (added[added.length - 1] ?? current).id }
    commit(next)
  }

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      {rows.map((row, i) => (
        <div key={row.id} className="flex items-start gap-2">
          <span aria-hidden className="mt-[13px] size-[7px] shrink-0 rotate-45 bg-[var(--primary-text)]" />
          <AutoTextarea
            ref={el => {
              if (el) fields.current.set(row.id, el)
              else fields.current.delete(row.id)
            }}
            value={row.text}
            onChange={v => setRows(rs => rs.map(r => (r.id === row.id ? { ...r, text: v.replace(/[\r\n]+/g, ' ') } : r)))}
            onBlur={() => persist(rows)}
            onKeyDown={e => onKeyDown(e, i)}
            onPaste={e => onPaste(e, i)}
            placeholder={placeholder}
            ariaLabel={`${label}: item ${i + 1} de ${rows.length}`}
            minRows={1}
            maxLength={500}
          />
          <RemoveButton onClick={() => remove(i, false)} label={`Remover item ${i + 1} de ${label}`} />
        </div>
      ))}
      <AddButton onClick={() => insertAfter(rows.length - 1)}>{addLabel}</AddButton>
    </div>
  )
}

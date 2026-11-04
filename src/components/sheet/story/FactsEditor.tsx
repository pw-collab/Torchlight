'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { InlineMarkdown } from '@/components/sheet/story/StoryMarkdown'
import { AddButton, INPUT_CLASS, RemoveButton } from '@/components/sheet/story/fields'
import { newId } from '@/lib/story'
import type { StoryFact } from '@/types/character.types'

/** Um fato que vem da ficha (Jogador, Classe) e não se edita aqui. */
export interface SheetFact {
  label: string
  value: string
}

/** Rótulos que a ficha de referência usa, sugeridos ao criar um fato. */
const LABEL_SUGGESTIONS = ['Origem', 'Declara vir de', 'Patrono', 'Mentor', 'Ocupação', 'Idade', 'Moradia', 'Juramento']

/** A coluna de fatos da capa: os da ficha primeiro, depois os do jogador. */
export function FactsList({ sheet, facts }: { sheet: SheetFact[]; facts: StoryFact[] }) {
  const rows = [
    ...sheet.map((f, i) => ({ key: `sheet-${i}`, ...f })),
    ...facts.map(f => ({ key: f.id, label: f.label, value: f.value })),
  ].filter(f => f.value.trim())

  return (
    <dl className="story-facts">
      {rows.map(f => (
        <div key={f.key}>
          {f.label.trim() && <dt>{f.label}</dt>}
          <dd><InlineMarkdown>{f.value}</InlineMarkdown></dd>
        </div>
      ))}
    </dl>
  )
}

const isEmpty = (f: StoryFact) => !f.label.trim() && !f.value.trim()

/** Os fatos do jogador: rótulo livre e valor, um por linha. */
export function FactsEditor({ facts, onSave }: { facts: StoryFact[]; onSave: (facts: StoryFact[]) => void }) {
  const [rows, setRows] = useState<StoryFact[]>(facts)
  const saved = useRef(JSON.stringify(facts.filter(f => !isEmpty(f))))
  const labels = useRef(new Map<string, HTMLInputElement>())
  const focusId = useRef<string | null>(null)

  useEffect(() => {
    if (!focusId.current) return
    labels.current.get(focusId.current)?.focus()
    focusId.current = null
  })

  function persist(next: StoryFact[]) {
    const kept = next.filter(f => !isEmpty(f))
    const key = JSON.stringify(kept)
    if (key === saved.current) return
    saved.current = key
    onSave(kept)
  }

  function change(id: string, patch: Partial<StoryFact>) {
    setRows(list => list.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }

  function remove(id: string) {
    const next = rows.filter(f => f.id !== id)
    setRows(next)
    persist(next)
  }

  function add() {
    const fact = { id: newId(), label: '', value: '' }
    focusId.current = fact.id
    setRows([...rows, fact])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <datalist id="story-fact-labels">
        {LABEL_SUGGESTIONS.map(l => <option key={l} value={l} />)}
      </datalist>
      {rows.map((fact, i) => {
        const name = fact.label.trim() || `fato ${i + 1}`
        return (
          <div key={fact.id} role="group" aria-label={name} className="flex items-center gap-1.5">
            <Input
              ref={el => {
                if (el) labels.current.set(fact.id, el)
                else labels.current.delete(fact.id)
              }}
              list="story-fact-labels"
              value={fact.label}
              onChange={e => change(fact.id, { label: e.target.value })}
              onBlur={() => persist(rows)}
              placeholder="Rótulo"
              aria-label={`Rótulo do ${name}`}
              maxLength={40}
              className={`${INPUT_CLASS} w-[38%] shrink-0`}
            />
            <Input
              value={fact.value}
              onChange={e => change(fact.id, { value: e.target.value })}
              onBlur={() => persist(rows)}
              placeholder="Ex.: Petre Teodorus, burgomestre de Immol"
              aria-label={`Valor do ${name}`}
              maxLength={160}
              className={`${INPUT_CLASS} min-w-0 flex-1`}
            />
            <RemoveButton onClick={() => remove(fact.id)} label={`Remover ${name}`} />
          </div>
        )
      })}
      <AddButton onClick={add}>Adicionar fato</AddButton>
    </div>
  )
}

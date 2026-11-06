'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { InlineMarkdown, StoryMarkdown } from '@/components/sheet/story/StoryMarkdown'
import { AddButton, AutoTextarea, FieldLabel, INPUT_CLASS, RemoveButton } from '@/components/sheet/story/fields'
import { newId } from '@/lib/story'
import type { StoryInstitution, StoryPerson } from '@/types/character.types'

// ─── Leitura ──────────────────────────────────────────────────────────────────

/** As pessoas, em fichas de duas colunas: nome, quem é, o que se sabe dela. */
export function PeopleCards({ people }: { people: StoryPerson[] }) {
  return (
    <div className="story-people">
      {people.map(person => (
        <article key={person.id} className="story-person">
          {person.name.trim() && <h3 className="story-person__name">{person.name}</h3>}
          {person.role.trim() && (
            <p className="story-person__role"><InlineMarkdown>{person.role}</InlineMarkdown></p>
          )}
          {person.note.trim() && <StoryMarkdown className="story-prose--compact">{person.note}</StoryMarkdown>}
        </article>
      ))}
    </div>
  )
}

/** As instituições, lado a lado num bloco só, como no pé da ficha. */
export function InstitutionsBox({ institutions }: { institutions: StoryInstitution[] }) {
  return (
    <div className="story-institutions">
      {institutions.map(item => (
        <div key={item.id}>
          {item.name.trim() && <h3 className="story-institution__name">{item.name}</h3>}
          {item.note.trim() && <StoryMarkdown className="story-prose--compact">{item.note}</StoryMarkdown>}
        </div>
      ))}
    </div>
  )
}

// ─── Edição ───────────────────────────────────────────────────────────────────

/**
 * Uma lista de fichas editáveis com o mesmo jeito de salvar dos bullets:
 * o que se digita fica no rascunho, e sai para o banco ao deixar o campo,
 * sem as fichas vazias.
 */
function useCardList<T extends { id: string }>(initial: T[], isEmpty: (item: T) => boolean, onSave: (items: T[]) => void) {
  const [items, setItems] = useState<T[]>(initial)
  const saved = useRef(JSON.stringify(initial.filter(i => !isEmpty(i))))
  const focusId = useRef<string | null>(null)
  const firstFields = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (!focusId.current) return
    firstFields.current.get(focusId.current)?.focus()
    focusId.current = null
  })

  function persist(next: T[]) {
    const kept = next.filter(i => !isEmpty(i))
    const key = JSON.stringify(kept)
    if (key === saved.current) return
    saved.current = key
    onSave(kept)
  }

  return {
    items,
    change(id: string, patch: Partial<T>) {
      setItems(list => list.map(i => (i.id === id ? { ...i, ...patch } : i)))
    },
    persist: () => persist(items),
    add(item: T) {
      focusId.current = item.id
      setItems([...items, item])
    },
    remove(id: string) {
      const next = items.filter(i => i.id !== id)
      setItems(next)
      persist(next)
    },
    /** Registra o primeiro campo de cada ficha, que recebe o foco ao criá-la. */
    firstField: (id: string) => (el: HTMLElement | null) => {
      if (el) firstFields.current.set(id, el)
      else firstFields.current.delete(id)
    },
  }
}

const isEmptyPerson = (p: StoryPerson) => !p.name.trim() && !p.role.trim() && !p.note.trim()
const isEmptyInstitution = (x: StoryInstitution) => !x.name.trim() && !x.note.trim()

const CARD_CLASS = 'border-border bg-[var(--bg-raised)] relative flex flex-col gap-2.5 border p-3'

export function PeopleEditor({ people, onSave }: { people: StoryPerson[]; onSave: (people: StoryPerson[]) => void }) {
  const list = useCardList(people, isEmptyPerson, onSave)

  return (
    <div className="flex flex-col gap-3">
      {list.items.map((person, i) => {
        const base = `person-${person.id}`
        const who = person.name.trim() || `pessoa ${i + 1}`
        return (
          <div key={person.id} role="group" aria-label={who} className={CARD_CLASS}>
            <div className="pr-8">
              <FieldLabel htmlFor={`${base}-name`}>Nome</FieldLabel>
              <Input
                ref={list.firstField(person.id)}
                id={`${base}-name`}
                value={person.name}
                onChange={e => list.change(person.id, { name: e.target.value })}
                onBlur={list.persist}
                placeholder="Ex.: Jahir"
                maxLength={80}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${base}-role`}>Quem é</FieldLabel>
              <Input
                id={`${base}-role`}
                value={person.role}
                onChange={e => list.change(person.id, { role: e.target.value })}
                onBlur={list.persist}
                placeholder="Ex.: o mendigo andarilho, seu mentor"
                maxLength={140}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${base}-note`}>O que sabe dela, e como a vê</FieldLabel>
              <AutoTextarea
                id={`${base}-note`}
                value={person.note}
                onChange={v => list.change(person.id, { note: v })}
                onBlur={list.persist}
                placeholder="Ex.: Apareceu duas vezes em momentos críticos, e nas duas resolveu o que ninguém mais resolveria."
                minRows={2}
              />
            </div>
            {/* Último na ordem do Tab: quem passa de um campo ao outro não cai nele. */}
            <div className="absolute top-2 right-2">
              <RemoveButton onClick={() => list.remove(person.id)} label={`Remover ${who}`} />
            </div>
          </div>
        )
      })}
      <AddButton onClick={() => list.add({ id: newId(), name: '', role: '', note: '' })}>Adicionar pessoa</AddButton>
    </div>
  )
}

export function InstitutionsEditor({
  institutions, onSave,
}: {
  institutions: StoryInstitution[]
  onSave: (institutions: StoryInstitution[]) => void
}) {
  const list = useCardList(institutions, isEmptyInstitution, onSave)

  return (
    <div className="flex flex-col gap-3">
      {list.items.map((item, i) => {
        const base = `institution-${item.id}`
        const what = item.name.trim() || `instituição ${i + 1}`
        return (
          <div key={item.id} role="group" aria-label={what} className={CARD_CLASS}>
            <div className="pr-8">
              <FieldLabel htmlFor={`${base}-name`}>Nome</FieldLabel>
              <Input
                ref={list.firstField(item.id)}
                id={`${base}-name`}
                value={item.name}
                onChange={e => list.change(item.id, { name: e.target.value })}
                onBlur={list.persist}
                placeholder="Ex.: Academia Vermelha"
                maxLength={80}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${base}-note`}>O que é, e como a vê</FieldLabel>
              <AutoTextarea
                id={`${base}-note`}
                value={item.note}
                onChange={v => list.change(item.id, { note: v })}
                onBlur={list.persist}
                placeholder="Ex.: Instituição de origem, relação rompida."
                minRows={2}
              />
            </div>
            <div className="absolute top-2 right-2">
              <RemoveButton onClick={() => list.remove(item.id)} label={`Remover ${what}`} />
            </div>
          </div>
        )
      })}
      <AddButton onClick={() => list.add({ id: newId(), name: '', note: '' })}>Adicionar instituição</AddButton>
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  FourFinger03Icon,
  Moon02Icon,
  StarAward01Icon,
} from '@hugeicons/core-free-icons'
import type { Talent, TalentOrigin } from '@/types/talent.types'
import type { RollResult } from '@/lib/dice'
import { GlyphCard, POPOVER_BODY } from '@/components/shared/GlyphCard'
import { RollableText } from '@/components/shared/RollableText'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { CardIcon } from '@/components/sheet/ClassPanel'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ORIGIN_LABEL: Record<TalentOrigin, string> = {
  ancestry: 'Ancestralidade',
  class: 'Classe',
  general: 'Geral',
}

// Mirrors the class block's technique palette — every value clears 4.5:1 on
// the card face.
const ORIGIN_ACCENT: Record<TalentOrigin, string> = {
  class:    'var(--chart-1)',
  general:  'var(--muted-foreground)',
  ancestry: 'var(--foreground)',
}

/** Mirrors the technique deck's symbols so the two decks read as one set. */
const ORIGIN_ICON: Record<TalentOrigin, IconSvgElement> = {
  ancestry: Moon02Icon,
  class: FourFinger03Icon,
  general: StarAward01Icon,
}

const FIELD_LABEL_CLASS =
  'font-heading mb-1 text-[10px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase'

interface Props {
  talents: Talent[]
  onUpdate: (talents: Talent[]) => void
  onRoll?: (r: RollResult) => void
}

export function TalentsPanel({ talents, onUpdate, onRoll }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', origin: 'general' as TalentOrigin, description: '' })

  const invalid = !form.name.trim() || !form.description.trim()

  function closeForm() {
    setForm({ name: '', origin: 'general', description: '' })
    setEditingId(null)
    setFormOpen(false)
  }

  function submitForm() {
    if (invalid) return
    if (editingId) {
      onUpdate(talents.map(t => t.id === editingId
        ? { ...t, name: form.name, origin: form.origin, description: form.description }
        : t,
      ))
    } else {
      onUpdate([...talents, {
        id: Math.random().toString(36).substring(2, 9),
        name: form.name,
        origin: form.origin,
        description: form.description,
      }])
    }
    closeForm()
  }

  function startEdit(t: Talent) {
    setForm({ name: t.name, origin: t.origin, description: t.description })
    setEditingId(t.id)
    setFormOpen(true)
    setExpandedId(null)
  }

  function removeTalent(id: string) {
    if (id === editingId) closeForm()
    if (id === expandedId) setExpandedId(null)
    onUpdate(talents.filter(t => t.id !== id))
  }

  return (
    // Same container as the technique panel: card surface, three columns, a
    // full-width heading row and then one talent card per column.
    <section className="panel-grid">
      <SectionHeading
        className="panel-grid__row"
        trailing={
          <Button
            variant="secondary"
            className="tactile bg-input border-input text-foreground shrink-0"
            onClick={() => (formOpen ? closeForm() : setFormOpen(true))}
          >
            {formOpen ? '✕ Fechar' : '+ Adicionar'}
          </Button>
        }
      >
        Talentos &amp; Habilidades
      </SectionHeading>

      {/* Add / edit form */}
      {formOpen && (
        <div className="panel-grid__row">
          <div className="animate-ink-spread bg-secondary border-border flex flex-col gap-2.5 border px-4 py-3.5">
            <div className="grid-6 grid-6--tight">
              <Field className="col-span-4 col-sm-full">
                <FieldLabel htmlFor="talent-name" className={FIELD_LABEL_CLASS}>Nome</FieldLabel>
                <Input
                  id="talent-name"
                  type="text"
                  value={form.name}
                  placeholder="ex.: Visão nas Trevas"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-secondary text-secondary-foreground h-auto px-2.5 py-2 text-[13px]"
                />
              </Field>

              <Field className="col-span-2 col-sm-full">
                <FieldLabel htmlFor="talent-origin" className={FIELD_LABEL_CLASS}>Origem</FieldLabel>
                <Select
                  value={form.origin}
                  onValueChange={value => setForm(f => ({ ...f, origin: value as TalentOrigin }))}
                >
                  <SelectTrigger
                    id="talent-origin"
                    className="bg-secondary text-secondary-foreground h-auto w-full px-2.5 py-2 text-[13px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ancestry">Ancestralidade</SelectItem>
                    <SelectItem value="class">Classe</SelectItem>
                    <SelectItem value="general">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="talent-desc" className={FIELD_LABEL_CLASS}>Descrição</FieldLabel>
              <Input
                id="talent-desc"
                type="text"
                value={form.description}
                placeholder="O que este talento faz?"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="bg-secondary text-secondary-foreground h-auto px-2.5 py-2 text-[13px]"
              />
            </Field>

            <Button onClick={submitForm} disabled={invalid} className="tactile w-full">
              {editingId ? '✦ Salvar Alterações' : '✦ Registrar Talento'}
            </Button>
          </div>
        </div>
      )}

      {/* Deck — one card per column, rows growing with the list */}
      {talents.length === 0 && !formOpen ? (
        <p className="panel-grid__row text-[13px] text-[var(--muted-foreground)] italic">
          Nenhum talento registrado nos arquivos. Aqui ficam os talentos conquistados em
          jogo — rolagens de nível e concessões do mestre. Os de ancestralidade e arquétipo
          já constam entre as Técnicas.
        </p>
      ) : (
        talents.map(t => (
          <TalentCard
            key={t.id}
            talent={t}
            expanded={expandedId === t.id}
            onOpenChange={open => setExpandedId(open ? t.id : null)}
            onRemove={() => removeTalent(t.id)}
            onEdit={() => startEdit(t)}
            onRoll={onRoll}
          />
        ))
      )}
    </section>
  )
}

function TalentCard({ talent, expanded, onOpenChange, onRemove, onEdit, onRoll }: {
  talent: Talent
  expanded: boolean
  onOpenChange: (open: boolean) => void
  onRemove: () => void
  onEdit: () => void
  onRoll?: (r: RollResult) => void
}) {
  return (
    <GlyphCard
      glyph={<CardIcon icon={ORIGIN_ICON[talent.origin]} />}
      title={talent.name}
      caption={ORIGIN_LABEL[talent.origin]}
      accent={ORIGIN_ACCENT[talent.origin]}
      description={talent.description}
      open={expanded}
      onOpenChange={onOpenChange}
      footer={
        <>
          <Button variant="secondary" className="tactile flex-1" onClick={onEdit}>
            ✎ Editar
          </Button>
          <Button variant="hollow" className="tactile flex-1" onClick={onRemove}>
            ✕ Excluir
          </Button>
        </>
      }
    >
      <p style={POPOVER_BODY}>
        <RollableText text={talent.description} label={talent.name} onRoll={onRoll} />
      </p>
    </GlyphCard>
  )
}

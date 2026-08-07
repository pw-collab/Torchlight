'use client'

import { useState } from 'react'
import type { Talent, TalentOrigin } from '@/types/talent.types'
import type { RollResult } from '@/lib/dice'
import { GlyphCard, POPOVER_BODY } from '@/components/shared/GlyphCard'
import { RollableText } from '@/components/shared/RollableText'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

const ORIGIN_GLYPH: Record<TalentOrigin, string> = {
  ancestry: '☽',
  class: '☿',
  general: '✦',
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
    <Card className="worn-border bg-transparent p-10 ring-0">
      <SectionHeading
        trailing={
          <Button
            variant="secondary"
            className="tactile shrink-0"
            onClick={() => (formOpen ? closeForm() : setFormOpen(true))}
          >
            {formOpen ? '✕ Fechar' : '+ Adicionar'}
          </Button>
        }
      >
        Talentos &amp; Habilidades
      </SectionHeading>

      <CardContent className="px-0">
        {/* Add / edit form */}
        {formOpen && (
          <div className="animate-ink-spread bg-secondary border-border mt-4 flex flex-col gap-2.5 border px-4 py-3.5">
            <div className="grid grid-cols-[2fr_1fr] gap-2.5">
              <Field>
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

              <Field>
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
        )}

        {/* List */}
        {talents.length === 0 && !formOpen ? (
          <p className="mt-4 text-[13px] text-[var(--muted-foreground)] italic">
            Nenhum talento registrado nos arquivos.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] items-start gap-2.5">
            {talents.map(t => (
              <TalentCard
                key={t.id}
                talent={t}
                expanded={expandedId === t.id}
                onOpenChange={open => setExpandedId(open ? t.id : null)}
                onRemove={() => removeTalent(t.id)}
                onEdit={() => startEdit(t)}
                onRoll={onRoll}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
      glyph={ORIGIN_GLYPH[talent.origin]}
      title={talent.name}
      caption={ORIGIN_LABEL[talent.origin]}
      accent={ORIGIN_ACCENT[talent.origin]}
      description={talent.description}
      dividerGlyph="✦"
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

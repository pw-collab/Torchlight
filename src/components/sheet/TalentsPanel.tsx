'use client'

import { useState } from 'react'
import type { Talent, TalentOrigin } from '@/types/talent.types'
import type { RollResult } from '@/lib/dice'
import { RollableText } from '@/components/shared/RollableText'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const ORIGIN_LABEL: Record<TalentOrigin, string> = {
  ancestry: 'Ancestralidade',
  class: 'Classe',
  general: 'Geral',
}

const ORIGIN_ACCENT: Record<TalentOrigin, { color: string; soft: string }> = {
  class:    { color: '#a56fde', soft: 'rgba(165,111,222,0.12)' },
  general:  { color: '#c8b890', soft: 'rgba(200,184,144,0.10)' },
  ancestry: { color: '#4fa98c', soft: 'rgba(79,169,140,0.12)' },
}

const ORIGIN_GLYPH: Record<TalentOrigin, string> = {
  ancestry: '☽',
  class: '☿',
  general: '✦',
}

const FIELD_LABEL_CLASS =
  'font-heading mb-1 text-[10px] tracking-[0.14em] text-[rgba(200,184,144,0.6)] uppercase'

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
          <p className="mt-4 text-[13px] text-[rgba(200,184,144,0.5)] italic">
            Nenhum talento registrado nos arquivos.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {talents.map(t => (
              <TalentRow
                key={t.id}
                talent={t}
                expanded={expandedId === t.id}
                onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
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

function TalentRow({ talent, expanded, onToggle, onRemove, onEdit, onRoll }: {
  talent: Talent
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
  onRoll?: (r: RollResult) => void
}) {
  const { color: accent, soft } = ORIGIN_ACCENT[talent.origin]

  return (
    <Collapsible open={expanded} onOpenChange={onToggle} className="flex flex-col">
      <CollapsibleTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            className="tactile h-auto w-full justify-start gap-2 bg-[#14110a] p-1.5 text-left normal-case"
            style={{ borderColor: accent }}
          />
        }
      >
        {/* Icon */}
        <span
          className="bg-secondary flex size-8 shrink-0 items-center justify-center border text-lg leading-none text-[#eee9dd]"
          style={{ borderColor: accent }}
        >
          {ORIGIN_GLYPH[talent.origin]}
        </span>

        {/* Name */}
        <span
          className="font-heading min-w-0 flex-1 truncate text-base tracking-normal"
          style={{ color: accent }}
        >
          {talent.name}
        </span>

        {/* Trailing: category + expand affordance */}
        <span className="bg-background flex shrink-0 items-stretch gap-2 self-stretch border border-[#0a0805] pl-1.5">
          <span
            className="flex items-center font-[var(--font-stat)] text-[10px] tracking-[1.2px] whitespace-nowrap uppercase"
            style={{ color: accent }}
          >
            {ORIGIN_LABEL[talent.origin]}
          </span>
          <span
            aria-hidden
            className={cn(
              'font-heading flex aspect-square items-center justify-center self-stretch border',
              'border-[#0a0805] text-base leading-none text-[#0a0805] transition-transform duration-200',
              expanded && 'rotate-90',
            )}
            style={{ background: accent }}
          >
            ↝
          </span>
        </span>
      </CollapsibleTrigger>

      {/* Expanded detail */}
      <CollapsibleContent
        className="animate-ink-spread flex flex-col gap-3 border border-t-0 px-3.5 py-3"
        style={{ background: soft, borderColor: accent }}
      >
        <p className="text-[13.5px] leading-relaxed text-[#d8cdb0]">
          <RollableText text={talent.description} label={talent.name} onRoll={onRoll} />
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="tactile" onClick={onEdit}>
            ✎ Editar
          </Button>
          <Button variant="hollow" className="tactile" onClick={onRemove}>
            ✕ Excluir
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface BackgroundDetails {
  concept?: string
  origin?: string
  backstory?: string
  traumaticEvents?: string
}

interface Relations {
  family?: string[]
  allies?: string[]
  rivals?: string[]
  faction?: string
}

interface Impulses {
  secrets?: string
  flaws?: string
  fears?: string
  objectives?: string
}

interface Props {
  backgroundDetails: BackgroundDetails
  relations: Relations
  impulses: Impulses
  onBackgroundChange: (patch: BackgroundDetails) => void
  onRelationsChange: (patch: Relations) => void
  onImpulsesChange: (patch: Impulses) => void
}

const SECTION_LABEL_CLASS =
  'font-heading mb-0.5 text-[8px] tracking-[0.22em] text-[var(--candle-amber)] uppercase'

const FIELD_LABEL_CLASS =
  'font-heading text-muted-foreground block text-[7px] tracking-[0.14em] uppercase'

const TEXTAREA_CLASS =
  'h-auto resize-y rounded-sm border-[rgba(139,112,48,0.22)] bg-[rgba(13,10,5,0.7)] px-[11px] py-2.5 text-[11px] leading-normal text-[var(--parchment-pale)] italic transition-colors duration-200 focus-visible:border-[rgba(196,120,42,0.5)]'

const INPUT_CLASS =
  'h-auto w-full flex-1 rounded-sm border-[rgba(139,112,48,0.25)] bg-[rgba(13,10,5,0.7)] px-2.5 py-[7px] text-xs text-[var(--parchment-pale)] transition-colors duration-200 focus-visible:border-[rgba(196,120,42,0.5)]'

export function StepNarrative({
  backgroundDetails, relations, impulses,
  onBackgroundChange, onRelationsChange, onImpulsesChange,
}: Props) {
  const [relInput, setRelInput] = useState({ family: '', allies: '', rivals: '' })

  function addRelItem(field: 'family' | 'allies' | 'rivals') {
    const val = relInput[field].trim()
    if (!val) return
    const prev = relations[field] ?? []
    if (prev.includes(val)) return
    onRelationsChange({ ...relations, [field]: [...prev, val] })
    setRelInput(r => ({ ...r, [field]: '' }))
  }

  function removeRelItem(field: 'family' | 'allies' | 'rivals', val: string) {
    onRelationsChange({ ...relations, [field]: (relations[field] ?? []).filter(x => x !== val) })
  }

  return (
    <div className="flex flex-col gap-7">

      {/* Histórico */}
      <FieldSet>
        <FieldLegend className={SECTION_LABEL_CLASS}>✎ Histórico</FieldLegend>
        <FieldGroup className="mt-2.5 grid grid-cols-2 gap-2.5">
          {(
            [
              { key: 'concept',        label: 'Conceito',           placeholder: 'Em uma frase, quem és tu?' },
              { key: 'origin',         label: 'Origem',             placeholder: 'De onde e como chegaste aqui?' },
              { key: 'backstory',      label: 'Passado',            placeholder: 'O que moldou o personagem antes da aventura...' },
              { key: 'traumaticEvents',label: 'Eventos Traumáticos', placeholder: 'Cicatrizes que o tempo não apagou...' },
            ] as { key: keyof BackgroundDetails; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <Field key={key} className="gap-1">
              <FieldLabel htmlFor={`bg-${key}`} className={FIELD_LABEL_CLASS}>{label}</FieldLabel>
              <Textarea
                id={`bg-${key}`}
                defaultValue={backgroundDetails[key] ?? ''}
                onBlur={e => onBackgroundChange({ ...backgroundDetails, [key]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                className={TEXTAREA_CLASS}
              />
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>

      {/* Relações */}
      <FieldSet>
        <FieldLegend className={SECTION_LABEL_CLASS}>◈ Relações</FieldLegend>
        <FieldGroup className="mt-2.5 flex flex-col gap-3">
          {(
            [
              { key: 'family', label: 'Família' },
              { key: 'allies', label: 'Aliados' },
              { key: 'rivals', label: 'Rivais' },
            ] as { key: 'family' | 'allies' | 'rivals'; label: string }[]
          ).map(({ key, label }) => (
            <Field key={key} className="gap-0">
              <FieldLabel htmlFor={`rel-${key}`} className={FIELD_LABEL_CLASS}>{label}</FieldLabel>

              <div className="my-[5px] flex flex-wrap gap-[5px]">
                {(relations[key] ?? []).map(v => (
                  <Badge
                    key={v}
                    variant="outline"
                    render={
                      <button
                        type="button"
                        onClick={() => removeRelItem(key, v)}
                        aria-label={`Remover ${v}`}
                      />
                    }
                    className="cursor-pointer rounded-[10px] border-[rgba(139,112,48,0.3)] bg-[rgba(20,14,6,0.6)] px-2.5 py-[3px] text-[11px] text-[var(--parchment-light)] transition-all duration-150"
                  >
                    {v} ×
                  </Badge>
                ))}
              </div>

              <div className="flex gap-1.5">
                <Input
                  id={`rel-${key}`}
                  type="text"
                  value={relInput[key]}
                  onChange={e => setRelInput(r => ({ ...r, [key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addRelItem(key)}
                  placeholder={`Nome de ${label.toLowerCase()}...`}
                  className={INPUT_CLASS}
                />
                <Button
                  variant="outline"
                  onClick={() => addRelItem(key)}
                  className="h-auto rounded-sm border-[rgba(139,112,48,0.28)] bg-[rgba(139,112,48,0.12)] px-3 py-[7px] text-[8px] tracking-[0.1em] text-[var(--parchment-light)]"
                >
                  + Add
                </Button>
              </div>
            </Field>
          ))}

          <Field className="gap-0">
            <FieldLabel htmlFor="rel-faction" className={FIELD_LABEL_CLASS}>Facção</FieldLabel>
            <Input
              id="rel-faction"
              type="text"
              defaultValue={relations.faction ?? ''}
              onBlur={e => onRelationsChange({ ...relations, faction: e.target.value })}
              placeholder="Guilda, culto, ordem ou grupo..."
              className={`${INPUT_CLASS} mt-[5px]`}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Impulsos */}
      <FieldSet>
        <FieldLegend className={SECTION_LABEL_CLASS}>⚡ Impulsos</FieldLegend>
        <FieldGroup className="mt-2.5 grid grid-cols-2 gap-2.5">
          {(
            [
              { key: 'secrets',    label: 'Segredos',   placeholder: 'O que ninguém pode saber...' },
              { key: 'flaws',      label: 'Falhas',     placeholder: 'Os vícios e fraquezas que te definem...' },
              { key: 'fears',      label: 'Medos',      placeholder: 'O que te paralisa no escuro...' },
              { key: 'objectives', label: 'Objetivos',  placeholder: 'O que te faz continuar andando...' },
            ] as { key: keyof Impulses; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <Field key={key} className="gap-1">
              <FieldLabel htmlFor={`imp-${key}`} className={FIELD_LABEL_CLASS}>{label}</FieldLabel>
              <Textarea
                id={`imp-${key}`}
                defaultValue={impulses[key] ?? ''}
                onBlur={e => onImpulsesChange({ ...impulses, [key]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                className={TEXTAREA_CLASS}
              />
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>

    </div>
  )
}

'use client'

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
  family?: string
  allies?: string
  rivals?: string
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
  /** Creation: the character's name is settled here, with the rest of the story. */
  name?: string
  onNameChange?: (name: string) => void
  /** The archetype's narrative hook, offered as a starting thread. */
  hook?: string
}

const SECTION_LABEL_CLASS =
  'font-heading mb-0.5 text-[8px] tracking-[0.22em] text-[var(--muted-foreground)] uppercase'

const FIELD_LABEL_CLASS =
  'font-heading text-muted-foreground block text-[7px] tracking-[0.14em] uppercase'

const TEXTAREA_CLASS =
  'h-auto resize-y rounded-sm border-[var(--border)] bg-[var(--card)] px-[11px] py-2.5 text-[11px] leading-normal text-[var(--foreground)] italic transition-colors duration-200 focus-visible:border-[var(--primary)]'

const INPUT_CLASS =
  'h-auto w-full flex-1 rounded-sm border-[var(--border)] bg-[var(--card)] px-2.5 py-[7px] text-xs text-[var(--foreground)] transition-colors duration-200 focus-visible:border-[var(--primary)]'

export function StepNarrative({
  backgroundDetails, relations, impulses,
  onBackgroundChange, onRelationsChange, onImpulsesChange,
  name, onNameChange, hook,
}: Props) {
  return (
    <div className="flex flex-col gap-7">

      {/* Nome */}
      {onNameChange && (
        <Field>
          <FieldLabel htmlFor="character-name" className={SECTION_LABEL_CLASS}>
            Nome do Personagem
          </FieldLabel>
          <Input
            id="character-name"
            type="text"
            value={name ?? ''}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Como te chamam nas Terras das Brumas?"
            className="h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-[15px] tracking-[0.02em] text-[var(--foreground)] focus-visible:border-[var(--primary)]"
          />
        </Field>
      )}

      {/* Gancho do arquétipo */}
      {hook && (
        <div className="rounded-sm border-l-2 border-[var(--destructive)] bg-[var(--card)] px-3.5 py-2.5">
          <span className={SECTION_LABEL_CLASS}>Gancho do arquétipo</span>
          <p className="text-muted-foreground mt-1 text-[11.5px] leading-relaxed italic">
            {hook}
          </p>
          <p className="text-muted-foreground/70 mt-1.5 text-[10px]">
            Use-o como ponto de partida do passado abaixo — ou contradiga-o de propósito.
          </p>
        </div>
      )}

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
              { key: 'family', label: 'Família', placeholder: 'Quem o criou, quem o renegou — um por linha.' },
              { key: 'allies', label: 'Aliados', placeholder: 'Quem atende quando ele chama, e a que preço.' },
              { key: 'rivals', label: 'Rivais',  placeholder: 'Quem o procura, e o que quer dele.' },
            ] as { key: 'family' | 'allies' | 'rivals'; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <Field key={key} className="gap-1">
              <FieldLabel htmlFor={`rel-${key}`} className={FIELD_LABEL_CLASS}>{label}</FieldLabel>
              <Textarea
                id={`rel-${key}`}
                defaultValue={relations[key] ?? ''}
                onBlur={e => onRelationsChange({ ...relations, [key]: e.target.value })}
                placeholder={placeholder}
                rows={2}
                className={TEXTAREA_CLASS}
              />
            </Field>
          ))}

          <Field className="gap-1">
            <FieldLabel htmlFor="rel-faction" className={FIELD_LABEL_CLASS}>Facção</FieldLabel>
            <Input
              id="rel-faction"
              type="text"
              defaultValue={relations.faction ?? ''}
              onBlur={e => onRelationsChange({ ...relations, faction: e.target.value })}
              placeholder="Guilda, culto, ordem ou grupo..."
              className={INPUT_CLASS}
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

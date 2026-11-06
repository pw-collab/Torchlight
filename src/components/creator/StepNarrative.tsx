'use client'

import type { ReactNode } from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { BulletEditor } from '@/components/sheet/story/BulletEditor'
import { MarkdownEditor } from '@/components/sheet/story/MarkdownEditor'
import { InstitutionsEditor, PeopleEditor } from '@/components/sheet/story/PeopleEditor'
import { FieldLabel as StoryLabel, TextField } from '@/components/sheet/story/fields'
import { storyMarkdown } from '@/lib/story'
import type { BackgroundDetails, Impulses, Relations } from '@/types/character.types'

interface Props {
  backgroundDetails: BackgroundDetails
  relations: Relations
  impulses: Impulses
  onBackgroundChange: (next: BackgroundDetails) => void
  onRelationsChange: (next: Relations) => void
  onImpulsesChange: (next: Impulses) => void
  /** Creation: the character's name is settled here, with the rest of the story. */
  name?: string
  onNameChange?: (name: string) => void
  /** The archetype's narrative hook, offered as a starting thread. */
  hook?: string
}

const SECTION_LABEL_CLASS =
  'font-mono font-semibold mb-0.5 text-[8px] tracking-[0.22em] text-[var(--muted-foreground)] uppercase'

/** Um capítulo do passo, com o nome em versalete como os outros passos. */
function Chapter({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className={SECTION_LABEL_CLASS}>{title}</h3>
        {note && <p className="text-muted-foreground mt-1 text-[11px] leading-snug italic">{note}</p>}
      </div>
      {children}
    </section>
  )
}

/**
 * A narrativa da criação, com os mesmos campos e editores da aba História
 * da ficha: o que se escreve aqui é o que a ficha mostra. A capa completa
 * (alcunha, fatos, tema, aparência) fica para a ficha, onde há espaço.
 */
export function StepNarrative({
  backgroundDetails, relations, impulses,
  onBackgroundChange, onRelationsChange, onImpulsesChange,
  name, onNameChange, hook,
}: Props) {
  const saveBackground = (patch: Partial<BackgroundDetails>) => onBackgroundChange({ ...backgroundDetails, ...patch })
  const saveImpulses = (patch: Partial<Impulses>) => onImpulsesChange({ ...impulses, ...patch })

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
          <p className="text-muted-foreground mt-1.5 text-[10px]">
            Use-o como ponto de partida da história abaixo, ou contradiga-o de propósito.
          </p>
        </div>
      )}

      <Chapter title="✎ Quem é">
        <TextField
          id="narrative-concept"
          label="Conceito"
          hint="Também é o texto do card na tela inicial."
          value={backgroundDetails.concept ?? ''}
          onSave={concept => saveBackground({ concept })}
          placeholder="Em uma frase, quem és tu?"
          multiline
          minRows={2}
          maxLength={400}
        />
        <TextField
          id="narrative-origin"
          label="De onde vem"
          value={backgroundDetails.origin ?? ''}
          onSave={origin => saveBackground({ origin })}
          placeholder="A terra e a cultura de onde vem, e o que aprendeu lá."
          multiline
          minRows={2}
        />
        <MarkdownEditor
          id="narrative-story"
          label="História"
          value={storyMarkdown(backgroundDetails)}
          // Os eventos traumáticos de antes já vêm no texto, como quadro.
          onSave={backstory => saveBackground({ backstory, traumaticEvents: undefined })}
          placeholder="O que aconteceu antes da primeira sessão. Use o Quadro para destacar uma marca, um juramento, uma cicatriz."
          minRows={6}
        />
      </Chapter>

      <Chapter title="◈ Pessoas e instituições" note="Quem é cada um, e como os vê.">
        <PeopleEditor people={relations.people} onSave={people => onRelationsChange({ ...relations, people })} />
        <div>
          <StoryLabel>Instituições</StoryLabel>
          <InstitutionsEditor
            institutions={relations.institutions}
            onSave={institutions => onRelationsChange({ ...relations, institutions })}
          />
        </div>
      </Chapter>

      <Chapter title="⚡ Impulsos" note="Um item por linha: Enter abre o próximo.">
        <div>
          <StoryLabel>O que quer</StoryLabel>
          <BulletEditor
            items={impulses.objectives}
            onSave={objectives => saveImpulses({ objectives })}
            label="O que quer"
            placeholder="O que te faz continuar andando."
          />
        </div>
        <div>
          <StoryLabel>Segredos</StoryLabel>
          <BulletEditor
            items={impulses.secrets}
            onSave={secrets => saveImpulses({ secrets })}
            label="Segredos"
            placeholder="O que ninguém pode saber."
          />
        </div>
        <div>
          <StoryLabel>Falhas</StoryLabel>
          <BulletEditor
            items={impulses.flaws}
            onSave={flaws => saveImpulses({ flaws })}
            label="Falhas"
            placeholder="Os vícios e fraquezas que te definem."
          />
        </div>
        <div>
          <StoryLabel>Medos</StoryLabel>
          <BulletEditor
            items={impulses.fears}
            onSave={fears => saveImpulses({ fears })}
            label="Medos"
            placeholder="O que te paralisa no escuro."
          />
        </div>
      </Chapter>

    </div>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Mortarboard02Icon, QuillWrite02Icon, TranslateIcon } from '@hugeicons/core-free-icons'
import type {
  BackgroundDetails,
  Character,
  CharacterRow,
  Impulses,
  KnowledgeArea,
  Relations,
} from '@/types/character.types'
import { DOMAINS, getDomain } from '@/data/domains/index'
import { getAncestry } from '@/data/ancestries/index'
import { getArchetype } from '@/data/archetypes/index'
import { getClass } from '@/data/classes/index'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { StoryMarkdown } from '@/components/sheet/story/StoryMarkdown'
import { BulletEditor, BulletList } from '@/components/sheet/story/BulletEditor'
import { MarkdownEditor } from '@/components/sheet/story/MarkdownEditor'
import { FactsEditor, FactsList, type SheetFact } from '@/components/sheet/story/FactsEditor'
import {
  InstitutionsBox,
  InstitutionsEditor,
  PeopleCards,
  PeopleEditor,
} from '@/components/sheet/story/PeopleEditor'
import {
  AutoTextarea,
  EditToggle,
  FieldLabel,
  INPUT_CLASS,
  RemoveButton,
  TextField,
} from '@/components/sheet/story/fields'
import { firstName, storyMarkdown, withPeriod } from '@/lib/story'
import { cn } from '@/lib/utils'

/*
 * A aba História, na estrutura da ficha do jogador:
 *
 *   Capa                    nome, outro nome, alcunha e apresentação; os
 *                           fatos (jogador, classe, origem, patrono…); tema,
 *                           aparência e o que ele quer
 *   História                um texto só, em Markdown
 *   Por dentro              de onde vem, segredos, falhas, medos e por que
 *                           anda com o grupo
 *   Pessoas e instituições  quem ele conhece, e como vê cada um
 *
 * Cada capítulo se lê como documento e abre num editor pelo "Editar" do
 * cabeçalho. Antes deles fica a Mesa (desktop); depois, os Conhecimentos e o
 * Caderno, que mudam com o jogo e por isso seguem sempre editáveis.
 */

const FAITHS = [
  'A Igreja de Ezra da Fé Matriz',
  'A Igreja de Ezra dos Corações Puros',
  'A Igreja de Ezra dos Eruditos',
  'A Igreja de Ezra dos Zelotes',
  'A Igreja de Hala',
  'A Divindade da Humanidade',
  'A Fé de Ferro',
  'A Ordem Eterna',
  'O Culto do Senhor da Manhã',
  'Nenhuma / Sem fé',
]

/** O NativeSelect põe a classe no invólucro; o visual de campo vai para o select. */
const SELECT_CLASS = cn(
  'w-full cursor-pointer',
  '[&>select]:h-auto [&>select]:rounded-[1px] [&>select]:border-[var(--border)] [&>select]:bg-[var(--background)]',
  '[&>select]:py-1.5 [&>select]:text-[13px] [&>select]:leading-[1.5] [&>select]:text-[var(--foreground)]',
)

// ─── Peças da página ──────────────────────────────────────────────────────────

/** Título do capítulo, a ação de editar e a linha que diz o que ele guarda. */
function ChapterHeading({ id, title, subtitle, editing, onToggle }: {
  id: string
  title: string
  subtitle: string
  editing: boolean
  onToggle: () => void
}) {
  return (
    <>
      <div className="story-chapter__head">
        <h2 id={id} className="story-chapter__title">{title}</h2>
        <EditToggle editing={editing} onClick={onToggle} chapter={title} />
      </div>
      <p className="story-subtitle">{subtitle}</p>
    </>
  )
}

/** Um bloco rotulado da leitura: Tema, Segredos, Medos. */
function StoryBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="story-block">
      <h3 className="story-label">{label}</h3>
      {children}
    </div>
  )
}

/** O lugar de um capítulo ainda vazio: o que vai nele, e o atalho para escrever. */
function EmptyInvite({ children, action, onAction }: { children: ReactNode; action: string; onAction: () => void }) {
  return (
    <div className="story-empty">
      <span className="min-w-0 flex-1">{children}</span>
      <Button
        type="button"
        variant="outline"
        onClick={onAction}
        className="h-8 shrink-0 rounded-[1px] px-2.5 text-[10px] tracking-[0.14em] not-italic"
      >
        {action}
      </Button>
    </div>
  )
}

/** "Wizard · Necromante, nível 3": a classe da capa, como a ficha a escreve. */
function classLine(className: string, archetypeName: string | undefined, level: number): string {
  return `${archetypeName ? `${className} · ${archetypeName}` : className}, nível ${level}`
}

// ─── Capa ─────────────────────────────────────────────────────────────────────

interface ChapterProps {
  character: Character
  saveBackground: (patch: Partial<BackgroundDetails>) => void
  saveImpulses: (patch: Partial<Impulses>) => void
}

function CoverChapter({ character, playerName, saveBackground, saveImpulses, onUpdate }: ChapterProps & {
  playerName?: string
  onUpdate: (patch: Partial<CharacterRow>) => void
}) {
  const [editing, setEditing] = useState(false)
  const bg = character.backgroundDetails
  const objectives = character.impulses.objectives
  const first = firstName(character.name)
  const wantsLabel = first ? `O que ${first} quer` : 'O que quer'

  const cls = getClass(character.classId)
  const archetype = character.archetypeId ? getArchetype(character.archetypeId) : undefined
  const ancestry = getAncestry(character.ancestryId)
  const domain = character.domainId ? getDomain(character.domainId) : undefined

  const sheetFacts: SheetFact[] = [
    { label: 'Jogador', value: playerName ?? '' },
    { label: 'Classe', value: classLine(cls?.name ?? character.classId, archetype?.name, character.level) },
    { label: 'Ancestralidade', value: ancestry?.name ?? '' },
  ]
  // A cidade e o domínio numa linha só, como a ficha escreve: "Toyalis, Hazlan".
  const origin = [bg.hometown?.trim(), domain?.name].filter(Boolean).join(', ')
  const placeFacts: SheetFact[] = [
    { label: 'Origem', value: origin },
    { label: 'Fé', value: character.faith },
  ]

  const epithet = bg.epithet?.trim() ?? ''
  const concept = bg.concept?.trim() ?? ''
  const theme = bg.theme?.trim() ?? ''
  const appearance = bg.appearance?.trim() ?? ''
  const hasMain = Boolean(theme || appearance || objectives.length)

  return (
    <section className="card-surface story-section" aria-labelledby="story-cover">
      <header className="story-cover__head">
        <div className="min-w-0">
          <h2 id="story-cover" className="story-cover__name">{character.name}</h2>
          {bg.alias?.trim() && <p className="story-cover__alias">{bg.alias}</p>}
        </div>
        <EditToggle editing={editing} onClick={() => setEditing(e => !e)} chapter="Capa" />
      </header>

      {editing ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 @min-[480px]:grid-cols-2">
            <TextField
              id="story-alias"
              label="Outro nome"
              value={bg.alias ?? ''}
              onSave={alias => saveBackground({ alias })}
              placeholder="Ex.: nascido Aoth Hahpet"
            />
            <TextField
              id="story-epithet"
              label="Alcunha"
              value={bg.epithet ?? ''}
              onSave={epithet => saveBackground({ epithet })}
              placeholder="Ex.: O Desertor Iluminado"
            />
          </div>
          <TextField
            id="story-concept"
            label="Conceito"
            hint="Também é o texto do card na tela inicial."
            value={bg.concept ?? ''}
            onSave={concept => saveBackground({ concept })}
            placeholder="Quem é, em duas ou três linhas."
            multiline
            minRows={2}
            maxLength={400}
          />

          <div>
            <FieldLabel hint="Jogador, classe e ancestralidade vêm da ficha.">Fatos</FieldLabel>
            <div className="border-border bg-[var(--bg-raised)] flex flex-col gap-3 border p-3">
              <div className="grid grid-cols-1 gap-3 @min-[480px]:grid-cols-3">
                <TextField
                  id="story-hometown"
                  label="Cidade natal"
                  value={bg.hometown ?? ''}
                  onSave={hometown => saveBackground({ hometown })}
                  placeholder="Ex.: Toyalis"
                  maxLength={60}
                />
                <div>
                  <FieldLabel htmlFor="story-domain">Domínio de origem</FieldLabel>
                  <NativeSelect
                    id="story-domain"
                    value={character.domainId}
                    onChange={e => onUpdate({ domain_id: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    <NativeSelectOption value="">Selecionar</NativeSelectOption>
                    {DOMAINS.map(d => <NativeSelectOption key={d.id} value={d.id}>{d.name}</NativeSelectOption>)}
                  </NativeSelect>
                </div>
                <div>
                  <FieldLabel htmlFor="story-faith">Fé</FieldLabel>
                  <NativeSelect
                    id="story-faith"
                    value={character.faith}
                    onChange={e => onUpdate({ faith: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    <NativeSelectOption value="">Selecionar</NativeSelectOption>
                    {FAITHS.map(f => <NativeSelectOption key={f} value={f}>{f}</NativeSelectOption>)}
                  </NativeSelect>
                </div>
              </div>
              <FactsEditor facts={bg.facts} onSave={facts => saveBackground({ facts })} />
            </div>
          </div>

          <TextField
            id="story-theme"
            label="Tema"
            value={bg.theme ?? ''}
            onSave={theme => saveBackground({ theme })}
            placeholder="A ideia que move o personagem."
            multiline
            minRows={2}
          />
          <TextField
            id="story-appearance"
            label="Aparência"
            value={bg.appearance ?? ''}
            onSave={appearance => saveBackground({ appearance })}
            placeholder="O que se vê à primeira vista, e o que fica escondido."
            multiline
            minRows={2}
          />
          <div>
            <FieldLabel hint="Um por linha. **Negrito** destaca o começo.">{wantsLabel}</FieldLabel>
            <BulletEditor
              items={objectives}
              onSave={next => saveImpulses({ objectives: next })}
              label={wantsLabel}
              placeholder="Ex.: **Descobrir** para que serve a chave preta."
            />
          </div>
        </div>
      ) : (
        <>
          {epithet || concept ? (
            <p className="story-cover__pitch">
              {epithet && <span className="story-cover__epithet">{concept ? withPeriod(epithet) : epithet}</span>}
              {epithet && concept ? ' ' : null}
              {concept}
            </p>
          ) : (
            <div className="mt-4">
              <EmptyInvite action="Escrever" onAction={() => setEditing(true)}>
                Quem é {first || 'o personagem'}, à primeira vista? A alcunha e o conceito abrem a ficha.
              </EmptyInvite>
            </div>
          )}

          <div className="story-cover__body">
            <FactsList sheet={[...sheetFacts, ...placeFacts]} facts={bg.facts} />
            <div className="min-w-0">
              {theme && <StoryBlock label="Tema"><StoryMarkdown>{theme}</StoryMarkdown></StoryBlock>}
              {appearance && <StoryBlock label="Aparência"><StoryMarkdown>{appearance}</StoryMarkdown></StoryBlock>}
              {objectives.length > 0 && <StoryBlock label={wantsLabel}><BulletList items={objectives} /></StoryBlock>}
              {!hasMain && (
                <p className="text-muted-foreground m-0 text-[13px] leading-relaxed italic">
                  Tema, aparência e o que {first || 'o personagem'} quer aparecem aqui.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

// ─── História ─────────────────────────────────────────────────────────────────

const STORY_PLACEHOLDER = [
  'Onde nasceu, como cresceu, o que fez sair de casa.',
  '',
  '> ## Uma marca que carrega',
  '> O que aconteceu, e o que ficou.',
].join('\n')

function HistoryChapter({ character, saveBackground }: Pick<ChapterProps, 'character' | 'saveBackground'>) {
  const [editing, setEditing] = useState(false)
  const story = storyMarkdown(character.backgroundDetails)

  return (
    <section className="card-surface story-section" aria-labelledby="story-history">
      <ChapterHeading
        id="story-history"
        title="História"
        subtitle="De onde veio, e o que fez até aqui."
        editing={editing}
        onToggle={() => setEditing(e => !e)}
      />
      <div className="story-chapter__body">
        {editing ? (
          <MarkdownEditor
            id="story-history-text"
            label="Texto da história"
            value={story}
            // O campo antigo de eventos traumáticos já está no texto, como quadro.
            onSave={backstory => saveBackground({ backstory, traumaticEvents: undefined })}
            placeholder={STORY_PLACEHOLDER}
            minRows={10}
            help={
              <>
                O primeiro parágrafo ganha letra capitular. O <strong className="text-foreground font-semibold">Quadro</strong>{' '}
                destaca um trecho: uma marca, um juramento, uma cicatriz. Dentro dele, os itens de lista que começam
                em <strong className="text-foreground font-semibold">negrito</strong> viram colunas.
              </>
            }
          />
        ) : story.trim() ? (
          <StoryMarkdown lead>{story}</StoryMarkdown>
        ) : (
          <EmptyInvite action="Escrever a história" onAction={() => setEditing(true)}>
            Ainda sem história: o que aconteceu antes da primeira sessão, e desde então.
          </EmptyInvite>
        )}
      </div>
    </section>
  )
}

// ─── Por dentro ───────────────────────────────────────────────────────────────

function InsideChapter({ character, saveBackground, saveImpulses }: ChapterProps) {
  const [editing, setEditing] = useState(false)
  const bg = character.backgroundDetails
  const { secrets, flaws, fears } = character.impulses
  const first = firstName(character.name)
  const originLabel = first ? `De onde ${first} vem` : 'De onde vem'

  const origin = bg.origin?.trim() ?? ''
  const companions = bg.companions?.trim() ?? ''
  const isEmpty = !origin && !companions && !secrets.length && !flaws.length && !fears.length

  const flawsBlock = flaws.length > 0 && <StoryBlock label="Falhas"><BulletList items={flaws} /></StoryBlock>
  const fearsBlock = fears.length > 0 && <StoryBlock label="Medos"><BulletList items={fears} /></StoryBlock>

  return (
    <section className="card-surface story-section" aria-labelledby="story-inside">
      <ChapterHeading
        id="story-inside"
        title="Por dentro"
        subtitle="O que interpretar à mesa, e por que anda com este grupo."
        editing={editing}
        onToggle={() => setEditing(e => !e)}
      />
      <div className="story-chapter__body">
        {editing ? (
          <div className="flex flex-col gap-4">
            <TextField
              id="story-origin"
              label={originLabel}
              value={bg.origin ?? ''}
              onSave={next => saveBackground({ origin: next })}
              placeholder="A terra e a cultura de onde vem, e o que aprendeu lá."
              multiline
              minRows={3}
            />
            <div>
              <FieldLabel hint="Um por linha.">Segredos</FieldLabel>
              <BulletEditor
                items={secrets}
                onSave={next => saveImpulses({ secrets: next })}
                label="Segredos"
                placeholder="Ex.: o nome que usa é falso."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 @min-[500px]:grid-cols-2">
              <div>
                <FieldLabel>Falhas</FieldLabel>
                <BulletEditor
                  items={flaws}
                  onSave={next => saveImpulses({ flaws: next })}
                  label="Falhas"
                  placeholder="Ex.: incapaz de ceder numa negociação."
                />
              </div>
              <div>
                <FieldLabel>Medos</FieldLabel>
                <BulletEditor
                  items={fears}
                  onSave={next => saveImpulses({ fears: next })}
                  label="Medos"
                  placeholder="Ex.: ser definido pelos outros."
                />
              </div>
            </div>
            <MarkdownEditor
              id="story-companions"
              label="Por que anda com eles"
              value={bg.companions ?? ''}
              onSave={next => saveBackground({ companions: next })}
              placeholder={'**Lucius e Yaeger.** Onde os conheceu, e o que deve a eles.'}
              minRows={3}
              blocks={false}
              help="Um parágrafo por pessoa ou dupla, com os nomes em negrito."
            />
          </div>
        ) : isEmpty ? (
          <EmptyInvite action="Escrever" onAction={() => setEditing(true)}>
            De onde vem, o que esconde, onde tropeça, do que foge, e por que anda com o grupo.
          </EmptyInvite>
        ) : (
          <>
            {origin && <StoryBlock label={originLabel}><StoryMarkdown>{origin}</StoryMarkdown></StoryBlock>}
            {secrets.length > 0 && <StoryBlock label="Segredos"><BulletList items={secrets} /></StoryBlock>}
            {flawsBlock && fearsBlock ? (
              <div className="story-block story-pair">{flawsBlock}{fearsBlock}</div>
            ) : (
              flawsBlock || fearsBlock
            )}
            {companions && (
              <StoryBlock label="Por que anda com eles"><StoryMarkdown>{companions}</StoryMarkdown></StoryBlock>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// ─── Pessoas e instituições ───────────────────────────────────────────────────

function PeopleChapter({ character, saveRelations }: {
  character: Character
  saveRelations: (patch: Partial<Relations>) => void
}) {
  const [editing, setEditing] = useState(false)
  const { people, institutions } = character.relations
  const first = firstName(character.name)

  return (
    <section className="card-surface story-section" aria-labelledby="story-people">
      <ChapterHeading
        id="story-people"
        title="Pessoas e instituições"
        subtitle={`O que ${first || 'o personagem'} sabe, e como as vê.`}
        editing={editing}
        onToggle={() => setEditing(e => !e)}
      />
      <div className="story-chapter__body">
        {editing ? (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="story-label">Pessoas</h3>
              <PeopleEditor people={people} onSave={next => saveRelations({ people: next })} />
            </div>
            <div>
              <h3 className="story-label">Instituições</h3>
              <InstitutionsEditor institutions={institutions} onSave={next => saveRelations({ institutions: next })} />
            </div>
          </div>
        ) : people.length === 0 && institutions.length === 0 ? (
          <EmptyInvite action="Adicionar" onAction={() => setEditing(true)}>
            Família, mentores, rivais, a ordem que está na sua cola: quem é cada um, e como os vê.
          </EmptyInvite>
        ) : (
          <>
            {people.length > 0 && <PeopleCards people={people} />}
            {institutions.length > 0 && <InstitutionsBox institutions={institutions} />}
          </>
        )}
      </div>
    </section>
  )
}

// ─── Conhecimentos e Caderno ──────────────────────────────────────────────────

/**
 * Um bloco agrupado: cabeçalho com ícone, nome e contagem, sobre o que o
 * grupo guarda.
 */
function SubPanel({
  icon, title, accent = 'var(--muted-foreground)', count, hint, children, className,
}: {
  icon: IconSvgElement
  title: string
  accent?: string
  count?: number
  /** O que vai aqui, só enquanto o bloco está vazio. */
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-input border-border flex flex-col border', className)}>
      <header
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'color-mix(in oklch, var(--border), transparent 30%)' }}
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} style={{ color: accent, flexShrink: 0 }} />
        <h3 className="font-mono text-foreground min-w-0 flex-1 truncate text-[11px] font-semibold tracking-[0.14em] uppercase">
          {title}
        </h3>
        {count !== undefined && (
          <span className="font-[var(--font-mono)] text-[11px] leading-none font-bold" style={{ color: count > 0 ? accent : 'var(--muted-foreground)' }}>
            {count}
          </span>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {hint && <p className="text-muted-foreground text-[10.5px] leading-snug italic">{hint}</p>}
        {children}
      </div>
    </section>
  )
}

function AddRow({ value, onChange, onAdd, placeholder }: {
  value: string; onChange: (v: string) => void; onAdd: () => void; placeholder?: string
}) {
  const active = value.trim().length > 0
  return (
    <div className="mt-auto flex gap-1.5 pt-1">
      <Input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={80}
        className={cn(INPUT_CLASS, 'min-w-0 flex-1')}
      />
      <Button
        variant="outline"
        onClick={onAdd}
        disabled={!active}
        aria-label={placeholder ? `Adicionar: ${placeholder}` : 'Adicionar'}
        className={cn(
          'border-border bg-card text-muted-foreground h-auto shrink-0 rounded-[1px] px-2.5 text-[13px] leading-none',
          'hover:border-primary hover:text-foreground transition-colors duration-200 disabled:opacity-35',
        )}
      >
        +
      </Button>
    </div>
  )
}

function KnowledgeSection({ character, onUpdate }: {
  character: Character
  onUpdate: (patch: Partial<CharacterRow>) => void
}) {
  const [langs, setLangs] = useState<string[]>(character.languages)
  const [langInput, setLangInput] = useState('')
  const [areas, setAreas] = useState<KnowledgeArea[]>(character.knowledgeAreas)
  const [newAreaName, setNewAreaName] = useState('')

  // O que o domínio da ancestralidade já oferece, a um toque cada.
  const ancestryData = getAncestry(character.ancestryId)
  const anyDomain = ancestryData?.domainOptions?.includes('*') ?? false
  const ancestryDomainId = anyDomain ? undefined : ancestryData?.domainOptions?.[0]
  const langPool = ancestryDomainId ? (getDomain(ancestryDomainId)?.languages ?? []) : []
  const langSuggestions = langPool.filter(l => !langs.includes(l))

  function saveLangs(next: string[]) {
    setLangs(next)
    onUpdate({ languages: next })
  }
  function addLang(lang: string) {
    const t = lang.trim()
    if (!t || langs.includes(t)) return
    saveLangs([...langs, t])
  }

  function saveAreas(next: KnowledgeArea[]) {
    setAreas(next)
    onUpdate({ knowledge_areas: next })
  }
  function addArea() {
    if (!newAreaName.trim()) return
    saveAreas([...areas, { name: newAreaName.trim(), bonus: 0 }])
    setNewAreaName('')
  }
  function updateArea(idx: number, patch: Partial<KnowledgeArea>, persist = false) {
    const next = areas.map((a, i) => i === idx ? { ...a, ...patch } : a)
    setAreas(next)
    if (persist) onUpdate({ knowledge_areas: next })
  }

  return (
    <section className="card-surface story-section">
      <SectionHeading className="mb-4">Conhecimentos</SectionHeading>
      <div className="grid-6 grid-6--tight">
        <SubPanel
          icon={TranslateIcon}
          title="Idiomas"
          count={langs.length}
          accent="var(--chart-1)"
          className="col-span-3 col-sm-full"
        >
          {langs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {langs.map(l => (
                <span
                  key={l}
                  className="border-border bg-card text-foreground inline-flex items-center gap-0.5 border py-0.5 pr-1 pl-2 text-[12px]"
                >
                  {l}
                  <RemoveButton onClick={() => saveLangs(langs.filter(x => x !== l))} label={`Remover ${l}`} />
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-[11px] italic">Nenhum idioma registrado.</p>
          )}

          {langSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-[9px] tracking-[0.12em] uppercase">Do domínio</span>
              {langSuggestions.map(l => (
                <Button
                  key={l}
                  variant="outline"
                  onClick={() => addLang(l)}
                  className={cn(
                    'font-sans text-muted-foreground border-border bg-card h-auto px-2 py-0.5',
                    'text-[11px] tracking-normal normal-case transition-colors duration-[160ms]',
                    'hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]',
                  )}
                >
                  + {l}
                </Button>
              ))}
            </div>
          )}

          <AddRow
            value={langInput}
            onChange={setLangInput}
            onAdd={() => { addLang(langInput); setLangInput('') }}
            placeholder="Outro idioma…"
          />
        </SubPanel>

        <SubPanel
          icon={Mortarboard02Icon}
          title="Áreas de Conhecimento"
          count={areas.length}
          accent="var(--chart-1)"
          className="col-span-3 col-sm-full"
        >
          {areas.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {areas.map((area, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    type="text"
                    value={area.name}
                    onChange={e => updateArea(i, { name: e.target.value })}
                    onBlur={e => updateArea(i, { name: e.target.value }, true)}
                    placeholder="Área de conhecimento"
                    aria-label="Área de conhecimento"
                    className={cn(INPUT_CLASS, 'min-w-0 flex-1')}
                  />
                  {/* O bônus é um número da ficha, então ganha o tratamento de numeral. */}
                  <span className="border-border bg-card flex shrink-0 items-center gap-1 border px-1.5 py-1">
                    <span className="font-mono font-semibold text-muted-foreground text-[8px] tracking-[0.12em] uppercase">Bônus</span>
                    <Input
                      type="number"
                      value={area.bonus}
                      onChange={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 })}
                      onBlur={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 }, true)}
                      aria-label={`Bônus de ${area.name || 'área de conhecimento'}`}
                      className="font-[var(--font-numeral)] text-foreground h-auto w-9 rounded-none border-none bg-transparent p-0 text-center text-[15px] [-moz-appearance:textfield]"
                    />
                  </span>
                  <RemoveButton onClick={() => saveAreas(areas.filter((_, j) => j !== i))} label={`Remover ${area.name || 'área'}`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-[11px] italic">
              Ofícios, saberes e obsessões: o que o personagem estudou de verdade.
            </p>
          )}
          <AddRow value={newAreaName} onChange={setNewAreaName} onAdd={addArea} placeholder="Nova área…" />
        </SubPanel>
      </div>
    </section>
  )
}

/**
 * O caderno (§5.9): o nome do NPC, a senha da porta, o que o taverneiro
 * deixou escapar. Fica no fim porque é a única parte da aba que muda toda
 * sessão, e segue sempre aberto para escrever.
 */
function NotebookSection({ character, onUpdate }: {
  character: Character
  onUpdate: (patch: Partial<CharacterRow>) => void
}) {
  const [notes, setNotes] = useState(character.notes)
  return (
    <section className="card-surface story-section">
      <SectionHeading className="mb-4">Caderno</SectionHeading>
      <SubPanel
        icon={QuillWrite02Icon}
        title="Anotações da campanha"
        accent="var(--chart-2)"
        hint={notes ? undefined : 'Nomes, senhas, dívidas, promessas: o que a mesa vai cobrar depois.'}
      >
        <AutoTextarea
          value={notes}
          onChange={setNotes}
          onBlur={value => onUpdate({ notes: value })}
          ariaLabel="Anotações da campanha"
          placeholder="O ferreiro deve um favor. A porta do porão abre com…"
          minRows={6}
          className="leading-[1.6]"
        />
      </SubPanel>
    </section>
  )
}

// ─── A aba ────────────────────────────────────────────────────────────────────

interface Props {
  character: Character
  onUpdate: (patch: Partial<CharacterRow>) => void
  /**
   * O que é da mesa e de nenhuma aba em especial: os handouts que o Mestre
   * deu, o descanso e a vista de longe. O desktop põe isso no topo desta aba;
   * o celular mantém no topo da ficha.
   */
  tableTools?: ReactNode
  /** Quem joga com o personagem: o "Jogador" da capa. */
  playerName?: string
}

export function BackstoryView({ character, onUpdate, tableTools, playerName }: Props) {
  // Cada parte salva o objeto inteiro, montado sobre o que a ficha tem agora:
  // dois capítulos abertos ao mesmo tempo não apagam o que o outro escreveu.
  const saveBackground = (patch: Partial<BackgroundDetails>) =>
    onUpdate({ background_details: { ...character.backgroundDetails, ...patch } })
  const saveImpulses = (patch: Partial<Impulses>) =>
    onUpdate({ impulses: { ...character.impulses, ...patch } })
  const saveRelations = (patch: Partial<Relations>) =>
    onUpdate({ relations: { ...character.relations, ...patch } })

  return (
    <div className="story">
      {tableTools && (
        <section className="card-surface story-section">
          <SectionHeading className="mb-4">Mesa</SectionHeading>
          <div className="flex flex-col gap-3">{tableTools}</div>
        </section>
      )}

      <CoverChapter
        character={character}
        playerName={playerName}
        saveBackground={saveBackground}
        saveImpulses={saveImpulses}
        onUpdate={onUpdate}
      />
      <HistoryChapter character={character} saveBackground={saveBackground} />
      <InsideChapter character={character} saveBackground={saveBackground} saveImpulses={saveImpulses} />
      <PeopleChapter character={character} saveRelations={saveRelations} />
      <KnowledgeSection character={character} onUpdate={onUpdate} />
      <NotebookSection character={character} onUpdate={onUpdate} />
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AlertDiamondIcon,
  ChurchIcon,
  Flag02Icon,
  GhostIcon,
  HandshakeIcon,
  HeartCrackIcon,
  Home01Icon,
  LockKeyIcon,
  MapPinHouseIcon,
  MaskTheater01Icon,
  Mortarboard02Icon,
  QuillWrite02Icon,
  Sword03Icon,
  Target01Icon,
  TranslateIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import type { Character, CharacterRow, KnowledgeArea } from '@/types/character.types'
import { DOMAINS } from '@/data/domains/index'
import { getAncestry } from '@/data/ancestries/index'
import { getDomain } from '@/data/domains/index'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Shared styles ────────────────────────────────────────────────────────────

/** The design's content container: card surface, 1px rule, 24px inset. */
const card: React.CSSProperties = { padding: 24 }

/**
 * Controls sit on --background, one step darker than the --input wells that
 * group them, so a field never dissolves into the block holding it.
 */
const INPUT_CLASS =
  'h-auto w-full rounded-[1px] border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-[13px] text-[var(--foreground)]'

const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`

// ─── Shared visual pieces ─────────────────────────────────────────────────────

/**
 * A grouped well: ruled header carrying an icon, the group's name and its
 * tally, over whatever the group holds. Every block on this tab is one of
 * these, so scanning the page is scanning a list of headers.
 */
function SubPanel({
  icon, title, accent = 'var(--muted-foreground)', count, hint, children, className,
}: {
  icon: IconSvgElement
  title: string
  /** Colours the icon, the tally and the header rule. */
  accent?: string
  /** Tally shown at the right of the header — omitted when there is none. */
  count?: number
  /**
   * One line under the header telling the player what belongs here. Callers
   * pass it only while the block is empty: it is scaffolding for filling the
   * sheet in, and once there is something to read it would only crowd it.
   */
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
        <h3 className="font-heading text-foreground min-w-0 flex-1 truncate text-[11px] font-semibold tracking-[0.14em] uppercase">
          {title}
        </h3>
        {count !== undefined && (
          <span className="font-[var(--font-mono)] text-[11px] leading-none font-bold" style={{ color: count > 0 ? accent : 'var(--muted-foreground)' }}>
            {count}
          </span>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {hint && (
          <p className="text-muted-foreground text-[10.5px] leading-snug italic">{hint}</p>
        )}
        {children}
      </div>
    </section>
  )
}

/**
 * Textarea that grows to fit what is written in it. The sheet is read at the
 * table far more often than it is filled in, and a fixed window turns a
 * backstory into three visible lines with a scrollbar.
 */
function AutoTextarea({
  value, onChange, onBlur, placeholder, ariaLabel, minRows = 3,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
  placeholder?: string
  ariaLabel: string
  minRows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Re-measured on every change, and once on mount for whatever was saved.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <Textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={e => onBlur(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn(INPUT_CLASS, 'resize-none overflow-hidden leading-[1.6]')}
    />
  )
}

function RemoveBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      aria-label={label}
      className="h-auto w-auto shrink-0 px-1 text-[11px] leading-none text-[var(--muted-foreground)] transition-colors duration-[160ms] hover:bg-transparent hover:text-[var(--destructive)]"
    >
      ✕
    </Button>
  )
}

function AddRow({
  value, onChange, onAdd, placeholder,
}: {
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

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  character: Character
  onUpdate: (patch: Partial<CharacterRow>) => void
}

export function BackstoryView({ character, onUpdate }: Props) {

  // ── Caderno (§5.9) ────────────────────────────────────────────────────────
  const [notes, setNotes] = useState(character.notes)

  // ── Conhecimentos: Languages ───────────────────────────────────────────────
  const [langs, setLangs] = useState<string[]>(character.languages)
  const [langInput, setLangInput] = useState('')

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

  // ── Conhecimentos: Knowledge areas ────────────────────────────────────────
  const [areas, setAreas] = useState<KnowledgeArea[]>(character.knowledgeAreas)
  const [newAreaName, setNewAreaName] = useState('')

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

  // ── Conhecimentos: Domain + Faith ─────────────────────────────────────────
  const [originDomain, setOriginDomain] = useState(character.domainId)
  const [faith, setFaith] = useState(character.faith)

  // ── Histórico ─────────────────────────────────────────────────────────────
  const [concept, setConcept] = useState(character.backgroundDetails.concept ?? '')
  const [bgOrigin, setBgOrigin] = useState(character.backgroundDetails.origin ?? '')
  const [backstory, setBackstory] = useState(character.backgroundDetails.backstory ?? '')
  const [traumatic, setTraumatic] = useState(character.backgroundDetails.traumaticEvents ?? '')

  // Saves the whole backgroundDetails object; `field` gets the fresh value from e.target
  function saveBg(field: 'concept' | 'origin' | 'backstory' | 'traumaticEvents', value: string) {
    onUpdate({
      background_details: {
        concept, origin: bgOrigin, backstory, traumaticEvents: traumatic,
        [field]: value,
      },
    })
  }

  // ── Relações ──────────────────────────────────────────────────────────────
  const [family, setFamily] = useState(character.relations.family ?? '')
  const [allies, setAllies] = useState(character.relations.allies ?? '')
  const [rivals, setRivals] = useState(character.relations.rivals ?? '')
  const [faction, setFaction] = useState(character.relations.faction ?? '')

  function saveRels(f: string, a: string, r: string, fa: string) {
    onUpdate({ relations: { family: f, allies: a, rivals: r, faction: fa } })
  }

  // ── Impulsos ──────────────────────────────────────────────────────────────
  const [secrets, setSecrets] = useState(character.impulses.secrets ?? '')
  const [flaws, setFlaws] = useState(character.impulses.flaws ?? '')
  const [fears, setFears] = useState(character.impulses.fears ?? '')
  const [objectives, setObjectives] = useState(character.impulses.objectives ?? '')

  function saveImp(field: 'secrets' | 'flaws' | 'fears' | 'objectives', value: string) {
    onUpdate({ impulses: { secrets, flaws, fears, objectives, [field]: value } })
  }

  // Each impulse is a different kind of pressure, so each carries its own
  // symbol and accent — four identical boxes told the player nothing.
  const impulses = [
    { field: 'secrets'    as const, title: 'Segredos',  icon: LockKeyIcon,      accent: 'var(--chart-1)',          value: secrets,    set: setSecrets,    hint: 'O que ninguém pode descobrir.',            example: 'Ex.: o nome que ele deixou para trás.' },
    { field: 'flaws'      as const, title: 'Falhas',    icon: AlertDiamondIcon, accent: 'var(--muted-foreground)', value: flaws,      set: setFlaws,      hint: 'O que sempre mete o personagem em apuros.', example: 'Ex.: nunca recusa uma aposta.' },
    { field: 'fears'      as const, title: 'Medos',     icon: GhostIcon,        accent: 'var(--destructive)',      value: fears,      set: setFears,      hint: 'Diante do que ele recua.',                 example: 'Ex.: água parada.' },
    { field: 'objectives' as const, title: 'Objetivos', icon: Target01Icon,     accent: 'var(--chart-2)',          value: objectives, set: setObjectives, hint: 'O que ele quer o bastante para arriscar.',  example: 'Ex.: comprar de volta o nome da família.' },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ── Seção 1: Conhecimentos ─────────────────────────────────────── */}
      <section className="card-surface" style={card}>
        <SectionHeading className="mb-4">Conhecimentos</SectionHeading>

        <div className="grid-6 grid-6--tight">
          {/* The two facts that place the character in the world lead the
              block; everything under them is a list the player grows. */}
          <SubPanel
            icon={MapPinHouseIcon}
            title="Domínio de Origem"
            className="col-span-3 col-sm-full"
          >
            <NativeSelect
              value={originDomain}
              onChange={e => { setOriginDomain(e.target.value); onUpdate({ domain_id: e.target.value }) }}
              aria-label="Domínio de origem"
              className={SELECT_CLASS}
            >
              <NativeSelectOption value="">— Selecionar —</NativeSelectOption>
              {DOMAINS.map(d => <NativeSelectOption key={d.id} value={d.id}>{d.name}</NativeSelectOption>)}
            </NativeSelect>
          </SubPanel>

          <SubPanel
            icon={ChurchIcon}
            title="Fé / Divindade"
            className="col-span-3 col-sm-full"
          >
            <NativeSelect
              value={faith}
              onChange={e => { setFaith(e.target.value); onUpdate({ faith: e.target.value }) }}
              aria-label="Fé / Divindade"
              className={SELECT_CLASS}
            >
              <NativeSelectOption value="">— Selecionar —</NativeSelectOption>
              {FAITHS.map(f => <NativeSelectOption key={f} value={f}>{f}</NativeSelectOption>)}
            </NativeSelect>
          </SubPanel>

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
                    <RemoveBtn onClick={() => saveLangs(langs.filter(x => x !== l))} label={`Remover ${l}`} />
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-[11px] italic">Nenhum idioma registrado.</p>
            )}

            {/* What the ancestry's domain already offers — one tap each. */}
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
                    {/* The bonus is a stat, so it gets the sheet's numeral
                        treatment rather than looking like another text box. */}
                    <span className="border-border bg-card flex shrink-0 items-center gap-1 border px-1.5 py-1">
                      <span className="font-heading text-muted-foreground text-[8px] tracking-[0.12em] uppercase">Bônus</span>
                      <Input
                        type="number"
                        value={area.bonus}
                        onChange={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 })}
                        onBlur={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 }, true)}
                        aria-label={`Bônus de ${area.name || 'área de conhecimento'}`}
                        className="font-[var(--font-numeral)] text-foreground h-auto w-9 rounded-none border-none bg-transparent p-0 text-center text-[15px] [-moz-appearance:textfield]"
                      />
                    </span>
                    <RemoveBtn onClick={() => saveAreas(areas.filter((_, j) => j !== i))} label={`Remover ${area.name || 'área'}`} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-[11px] italic">
                Ofícios, saberes e obsessões — o que o personagem estudou de verdade.
              </p>
            )}
            <AddRow value={newAreaName} onChange={setNewAreaName} onAdd={addArea} placeholder="Nova área…" />
          </SubPanel>
        </div>
      </section>

      {/* ── Seção 2: Histórico ─────────────────────────────────────────── */}
      <section className="card-surface" style={card}>
        <SectionHeading className="mb-4">Histórico</SectionHeading>

        <div className="grid-6 grid-6--tight">
          {/* Two lines that name the character, then the prose that explains
              them — the short fields never share a row with the long ones, so
              nothing leaves a hole beside it. */}
          <SubPanel icon={MaskTheater01Icon} title="Conceito" className="col-span-3 col-sm-full">
            <AutoTextarea
              value={concept}
              onChange={setConcept}
              onBlur={v => saveBg('concept', v)}
              ariaLabel="Conceito"
              placeholder="Uma frase que resume quem ele é."
              minRows={2}
            />
          </SubPanel>

          <SubPanel icon={Home01Icon} title="Origem" className="col-span-3 col-sm-full">
            <AutoTextarea
              value={bgOrigin}
              onChange={setBgOrigin}
              onBlur={v => saveBg('origin', v)}
              ariaLabel="Origem"
              placeholder="De onde ele veio."
              minRows={2}
            />
          </SubPanel>

          <SubPanel
            icon={QuillWrite02Icon}
            title="História de Fundo"
            accent="var(--chart-1)"
            className="col-span-6"
          >
            <AutoTextarea
              value={backstory}
              onChange={setBackstory}
              onBlur={v => saveBg('backstory', v)}
              ariaLabel="História de Fundo"
              placeholder="O que aconteceu antes da primeira sessão."
              minRows={5}
            />
          </SubPanel>

          <SubPanel
            icon={HeartCrackIcon}
            title="Eventos Traumáticos"
            accent="var(--destructive)"
            hint={traumatic ? undefined : 'As cicatrizes que o mestre pode puxar em jogo.'}
            className="col-span-6"
          >
            <AutoTextarea
              value={traumatic}
              onChange={setTraumatic}
              onBlur={v => saveBg('traumaticEvents', v)}
              ariaLabel="Eventos Traumáticos"
              placeholder="O que ele não superou."
              minRows={4}
            />
          </SubPanel>
        </div>
      </section>

      {/* ── Seção 3: Relações e Conexões ───────────────────────────────── */}
      <section className="card-surface" style={card}>
        <SectionHeading className="mb-4">Relações e Conexões</SectionHeading>

        <div className="grid-6 grid-6--tight">
          {/* Three open fields side by side, each with the accent its side of
              the table earns: kin warm, allies cool, rivals red. A name alone
              says little, so these take prose: who they are and what binds
              them, one per line. */}
          <SubPanel
            icon={UserGroupIcon}
            title="Família"
            accent="var(--chart-1)"
            hint={family ? undefined : 'Quem o criou, quem o renegou, quem ainda espera notícias.'}
            className="col-span-2 col-sm-full"
          >
            <AutoTextarea
              value={family}
              onChange={setFamily}
              onBlur={v => saveRels(v, allies, rivals, faction)}
              ariaLabel="Família"
              placeholder="Ex.: Mira, irmã mais velha — não fala com ele desde o enterro."
              minRows={3}
            />
          </SubPanel>

          <SubPanel
            icon={HandshakeIcon}
            title="Aliados"
            accent="var(--chart-2)"
            hint={allies ? undefined : 'Quem atende quando ele chama, e a que preço.'}
            className="col-span-2 col-sm-full"
          >
            <AutoTextarea
              value={allies}
              onChange={setAllies}
              onBlur={v => saveRels(family, v, rivals, faction)}
              ariaLabel="Aliados"
              placeholder="Ex.: Padre Anselmo — deve-lhe um silêncio."
              minRows={3}
            />
          </SubPanel>

          <SubPanel
            icon={Sword03Icon}
            title="Rivais"
            accent="var(--destructive)"
            hint={rivals ? undefined : 'Quem o procura, e o que quer dele.'}
            className="col-span-2 col-sm-full"
          >
            <AutoTextarea
              value={rivals}
              onChange={setRivals}
              onBlur={v => saveRels(family, allies, v, faction)}
              ariaLabel="Rivais"
              placeholder="Ex.: Barão Krev — cobra uma dívida que ele não contraiu."
              minRows={3}
            />
          </SubPanel>

          <SubPanel
            icon={Flag02Icon}
            title="Facção ou Sociedade"
            hint={faction ? undefined : 'A quem o personagem responde quando não responde a si mesmo.'}
            className="col-span-6"
          >
            <Input
              type="text"
              value={faction}
              onChange={e => setFaction(e.target.value)}
              onBlur={e => saveRels(family, allies, rivals, e.target.value)}
              placeholder="Nome da facção…"
              aria-label="Facção ou Sociedade"
              maxLength={80}
              className={INPUT_CLASS}
            />
          </SubPanel>
        </div>
      </section>

      {/* ── Seção 4: Impulsos ──────────────────────────────────────────── */}
      <section className="card-surface" style={card}>
        <SectionHeading className="mb-4">Impulsos</SectionHeading>

        <div className="grid-6 grid-6--tight">
          {impulses.map(({ field, title, icon, accent, value, set, hint, example }) => (
            <SubPanel
              key={field}
              icon={icon}
              title={title}
              accent={accent}
              hint={value ? undefined : hint}
              className="col-span-3 col-sm-full"
            >
              <AutoTextarea
                value={value}
                onChange={set}
                onBlur={v => saveImp(field, v)}
                ariaLabel={title}
                placeholder={example}
                minRows={3}
              />
            </SubPanel>
          ))}
        </div>
      </section>

      {/* ── Seção 5: Caderno ───────────────────────────────────────────── */}
      {/* O que o jogador anotava no WhatsApp e perdia: o nome do NPC, a senha
          da porta, o que o taverneiro deixou escapar. Fica no fim porque é a
          única parte da aba que muda toda sessão. */}
      <section className="card-surface" style={card}>
        <SectionHeading className="mb-4">Caderno</SectionHeading>

        <SubPanel
          icon={QuillWrite02Icon}
          title="Anotações da campanha"
          accent="var(--chart-2)"
          hint={notes ? undefined : 'Nomes, senhas, dívidas, promessas — o que a mesa vai cobrar depois.'}
        >
          <AutoTextarea
            value={notes}
            onChange={setNotes}
            onBlur={value => onUpdate({ notes: value })}
            ariaLabel="Anotações da campanha"
            placeholder="O ferreiro deve um favor. A porta do porão abre com…"
            minRows={6}
          />
        </SubPanel>
      </section>

    </div>
  )
}

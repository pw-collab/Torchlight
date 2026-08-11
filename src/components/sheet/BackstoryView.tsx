'use client'

import { useState } from 'react'
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

const card: React.CSSProperties = {
  padding: 42,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 7,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bone-muted)',
  marginBottom: 4,
}

const INPUT_CLASS =
  'h-auto w-full rounded-[1px] border-[var(--border)] bg-[var(--ink-deep)] px-2 py-[5px] text-[11px] text-[var(--parchment-light)]'

const TEXTAREA_CLASS = `${INPUT_CLASS} resize-y leading-normal`

const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  padding: '3px 7px 3px 9px',
  fontFamily: 'var(--font-body)',
  fontSize: 10.5,
  color: 'var(--parchment-light)',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div style={labelStyle}>{children}</div>
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      aria-label="Remover"
      className="h-auto w-auto shrink-0 px-px text-[10px] leading-none text-[var(--destructive)] transition-colors duration-[160ms] hover:bg-transparent hover:text-[var(--blood-bright)]"
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
    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
      <Input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={80}
        className={cn(INPUT_CLASS, 'flex-1')}
      />
      <Button
        variant="outline"
        onClick={onAdd}
        disabled={!active}
        className={cn(
          'h-auto rounded-[1px] px-2.5 text-[7.5px] tracking-[0.1em] transition-all duration-200',
          active
            ? 'text-foreground border-[var(--chart-2)] bg-[var(--chart-2)]/15'
            : 'text-muted-foreground border-[var(--chart-2)] bg-[var(--chart-2)]/15',
        )}
      >
        ✦ Adicionar
      </Button>
    </div>
  )
}

function ChipList({ items, onRemove }: { items: string[]; onRemove: (item: string) => void }) {
  if (!items.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
      {items.map(item => (
        <span key={item} style={chip}>
          {item}
          <RemoveBtn onClick={() => onRemove(item)} />
        </span>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  character: Character
  onUpdate: (patch: Partial<CharacterRow>) => void
}

export function BackstoryView({ character, onUpdate }: Props) {

  // ── Conhecimentos: Languages ───────────────────────────────────────────────
  const [langs, setLangs] = useState<string[]>(character.languages)
  const [langInput, setLangInput] = useState('')

  const ancestryData = getAncestry(character.ancestryId)
  const anyDomain = ancestryData?.domainOptions?.includes('*') ?? false
  const ancestryDomainId = anyDomain ? undefined : ancestryData?.domainOptions?.[0]
  const langPool = ancestryDomainId ? (getDomain(ancestryDomainId)?.languages ?? []) : []

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
  const [family, setFamily] = useState<string[]>(character.relations.family ?? [])
  const [allies, setAllies] = useState<string[]>(character.relations.allies ?? [])
  const [rivals, setRivals] = useState<string[]>(character.relations.rivals ?? [])
  const [faction, setFaction] = useState(character.relations.faction ?? '')
  const [famInput, setFamInput] = useState('')
  const [allyInput, setAllyInput] = useState('')
  const [rivalInput, setRivalInput] = useState('')

  function saveRels(f: string[], a: string[], r: string[], fa: string) {
    onUpdate({ relations: { family: f, allies: a, rivals: r, faction: fa } })
  }

  function addFamily() {
    const t = famInput.trim(); if (!t) return
    const next = [...family, t]; setFamily(next); setFamInput('')
    saveRels(next, allies, rivals, faction)
  }
  function addAlly() {
    const t = allyInput.trim(); if (!t) return
    const next = [...allies, t]; setAllies(next); setAllyInput('')
    saveRels(family, next, rivals, faction)
  }
  function addRival() {
    const t = rivalInput.trim(); if (!t) return
    const next = [...rivals, t]; setRivals(next); setRivalInput('')
    saveRels(family, allies, next, faction)
  }

  // ── Impulsos ──────────────────────────────────────────────────────────────
  const [secrets, setSecrets] = useState(character.impulses.secrets ?? '')
  const [flaws, setFlaws] = useState(character.impulses.flaws ?? '')
  const [fears, setFears] = useState(character.impulses.fears ?? '')
  const [objectives, setObjectives] = useState(character.impulses.objectives ?? '')

  function saveImp(field: 'secrets' | 'flaws' | 'fears' | 'objectives', value: string) {
    onUpdate({ impulses: { secrets, flaws, fears, objectives, [field]: value } })
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Seção 1: Conhecimentos ─────────────────────────────────────── */}
      <section className="worn-border" style={card}>
        <SectionHeading className="mb-3.5">Conhecimentos</SectionHeading>

        {/* Languages */}
        <div style={{ marginBottom: 18 }}>
          <Label>Idiomas</Label>
          {langs.length > 0 ? (
            <ChipList items={langs} onRemove={l => saveLangs(langs.filter(x => x !== l))} />
          ) : (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--bone-muted)', marginBottom: 4 }}>
              Nenhum idioma registrado.
            </p>
          )}
          {/* Domain pool chips */}
          {langPool.filter(l => !langs.includes(l)).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, marginTop: 4 }}>
              {langPool.filter(l => !langs.includes(l)).map(l => (
                <Button
                  key={l}
                  variant="outline"
                  onClick={() => addLang(l)}
                  className="font-sans text-muted-foreground h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] tracking-normal normal-case transition-all duration-[160ms] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
                >
                  + {l}
                </Button>
              ))}
            </div>
          )}
          <AddRow value={langInput} onChange={setLangInput} onAdd={() => { addLang(langInput); setLangInput('') }} placeholder="Outro idioma…" />
        </div>

        {/* Knowledge areas */}
        <div style={{ marginBottom: 18 }}>
          <Label>Áreas de Conhecimento</Label>
          {areas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
              {areas.map((area, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input
                    type="text"
                    value={area.name}
                    onChange={e => updateArea(i, { name: e.target.value })}
                    onBlur={e => updateArea(i, { name: e.target.value }, true)}
                    placeholder="Área de conhecimento"
                    aria-label="Área de conhecimento"
                    className={cn(INPUT_CLASS, 'flex-1')}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--bone-muted)' }}>Bônus</span>
                    <Input
                      type="number"
                      value={area.bonus}
                      onChange={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 })}
                      onBlur={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 }, true)}
                      aria-label="Bônus"
                      className={cn(INPUT_CLASS, 'w-12 text-center [-moz-appearance:textfield]')}
                    />
                  </div>
                  <RemoveBtn onClick={() => saveAreas(areas.filter((_, j) => j !== i))} />
                </div>
              ))}
            </div>
          )}
          <AddRow value={newAreaName} onChange={setNewAreaName} onAdd={addArea} placeholder="Nova área…" />
        </div>

        {/* Domain + Faith */}
        <div className="grid-6-split">
          <div>
            <Label>Domínio de Origem</Label>
            <NativeSelect
              value={originDomain}
              onChange={e => { setOriginDomain(e.target.value); onUpdate({ domain_id: e.target.value }) }}
              aria-label="Domínio de origem"
              className={SELECT_CLASS}
            >
              <NativeSelectOption value="">— Selecionar —</NativeSelectOption>
              {DOMAINS.map(d => <NativeSelectOption key={d.id} value={d.id}>{d.name}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div>
            <Label>Fé / Divindade</Label>
            <NativeSelect
              value={faith}
              onChange={e => { setFaith(e.target.value); onUpdate({ faith: e.target.value }) }}
              aria-label="Fé / Divindade"
              className={SELECT_CLASS}
            >
              <NativeSelectOption value="">— Selecionar —</NativeSelectOption>
              {FAITHS.map(f => <NativeSelectOption key={f} value={f}>{f}</NativeSelectOption>)}
            </NativeSelect>
          </div>
        </div>
      </section>

      {/* ── Seção 2: Histórico ─────────────────────────────────────────── */}
      <section className="worn-border" style={card}>
        <SectionHeading className="mb-3.5">Histórico</SectionHeading>
        <div className="grid-6-split">
          {([
            ['concept',         'Conceito',           concept,    setConcept,    3],
            ['origin',          'Origem',             bgOrigin,   setBgOrigin,   3],
            ['backstory',       'História de Fundo',  backstory,  setBackstory,  6],
            ['traumaticEvents', 'Eventos Traumáticos',traumatic,  setTraumatic,  6],
          ] as [string, string, string, (v: string) => void, number][]).map(([field, label, val, setVal, rows]) => (
            <div key={field}>
              <Label>{label}</Label>
              <Textarea
                rows={rows}
                value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={e => saveBg(field as Parameters<typeof saveBg>[0], e.target.value)}
                aria-label={label}
                className={TEXTAREA_CLASS}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Seção 3: Relações e Conexões ───────────────────────────────── */}
      <section className="worn-border" style={card}>
        <SectionHeading className="mb-3.5">Relações e Conexões</SectionHeading>
        <div className="grid-6-split" style={{ gap: 16 }}>

          <div>
            <Label>Membro da Família</Label>
            <ChipList items={family} onRemove={item => { const n = family.filter(x => x !== item); setFamily(n); saveRels(n, allies, rivals, faction) }} />
            <AddRow value={famInput} onChange={setFamInput} onAdd={addFamily} placeholder="Nome do familiar…" />
          </div>

          <div>
            <Label>Aliado</Label>
            <ChipList items={allies} onRemove={item => { const n = allies.filter(x => x !== item); setAllies(n); saveRels(family, n, rivals, faction) }} />
            <AddRow value={allyInput} onChange={setAllyInput} onAdd={addAlly} placeholder="Nome do aliado…" />
          </div>

          <div>
            <Label>Rival</Label>
            <ChipList items={rivals} onRemove={item => { const n = rivals.filter(x => x !== item); setRivals(n); saveRels(family, allies, n, faction) }} />
            <AddRow value={rivalInput} onChange={setRivalInput} onAdd={addRival} placeholder="Nome do rival…" />
          </div>

          <div>
            <Label>Facção ou Sociedade</Label>
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
          </div>
        </div>
      </section>

      {/* ── Seção 4: Impulsos ──────────────────────────────────────────── */}
      <section className="worn-border" style={card}>
        <SectionHeading className="mb-3.5">Impulsos</SectionHeading>
        <div className="grid-6-split">
          {([
            ['secrets',    'Segredos',  secrets,    setSecrets],
            ['flaws',      'Falhas',    flaws,      setFlaws],
            ['fears',      'Medos',     fears,      setFears],
            ['objectives', 'Objetivos', objectives, setObjectives],
          ] as [string, string, string, (v: string) => void][]).map(([field, label, val, setVal]) => (
            <div key={field}>
              <Label>{label}</Label>
              <Textarea
                rows={4}
                value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={e => saveImp(field as Parameters<typeof saveImp>[0], e.target.value)}
                aria-label={label}
                className={TEXTAREA_CLASS}
              />
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

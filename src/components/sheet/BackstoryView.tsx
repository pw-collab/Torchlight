'use client'

import { useState } from 'react'
import type { Character, CharacterRow, KnowledgeArea } from '@/types/character.types'
import { DOMAINS } from '@/data/domains/index'
import { getAncestry } from '@/data/ancestries/index'
import { getDomain } from '@/data/domains/index'
import { SectionHeading } from '@/components/shared/SectionHeading'

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

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--ink-deep)',
  border: '1px solid rgba(139,112,48,0.28)',
  color: 'var(--parchment-light)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  padding: '5px 8px',
  outline: 'none',
  borderRadius: 1,
  boxSizing: 'border-box',
}

const taStyle: React.CSSProperties = {
  ...inputBase,
  resize: 'vertical',
  lineHeight: 1.5,
}

const selStyle: React.CSSProperties = {
  ...inputBase,
  cursor: 'pointer',
}

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'rgba(42,34,16,0.5)',
  border: '1px solid rgba(139,112,48,0.32)',
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
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(139,21,21,0.45)', fontSize: 10,
        padding: '0 1px', lineHeight: 1, transition: 'color 160ms', flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--blood-bright)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,21,21,0.45)')}
    >✕</button>
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
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        placeholder={placeholder}
        maxLength={80}
        style={{ flex: 1, ...inputBase }}
      />
      <button
        onClick={onAdd}
        disabled={!active}
        style={{
          background: active ? 'rgba(42,80,69,0.3)' : 'rgba(42,80,69,0.12)',
          border: `1px solid ${active ? '#2A5045' : 'rgba(42,80,69,0.2)'}`,
          color: active ? 'var(--bone-white)' : 'var(--bone-muted)',
          fontFamily: 'var(--font-heading)', fontSize: 7.5, letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '0 10px',
          cursor: active ? 'pointer' : 'not-allowed', borderRadius: 1,
          transition: 'all 200ms', whiteSpace: 'nowrap',
        }}
      >✦ Adicionar</button>
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
        <SectionHeading marker="✦" style={{ marginBottom: 14 }}>Conhecimentos</SectionHeading>

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
                <button key={l} onClick={() => addLang(l)}
                  style={{
                    background: 'rgba(42,34,16,0.3)', border: '1px solid rgba(139,112,48,0.2)',
                    color: 'var(--bone-muted)', fontFamily: 'var(--font-body)', fontSize: 10,
                    padding: '2px 8px', borderRadius: 2, cursor: 'pointer', transition: 'all 160ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(106,58,10,0.3)'; e.currentTarget.style.color = 'var(--candle-amber)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(42,34,16,0.3)'; e.currentTarget.style.color = 'var(--bone-muted)' }}
                >+ {l}</button>
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
                  <input
                    type="text"
                    value={area.name}
                    onChange={e => updateArea(i, { name: e.target.value })}
                    onBlur={e => updateArea(i, { name: e.target.value }, true)}
                    placeholder="Área de conhecimento"
                    style={{ flex: 1, ...inputBase }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--bone-muted)' }}>Bônus</span>
                    <input
                      type="number"
                      value={area.bonus}
                      onChange={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 })}
                      onBlur={e => updateArea(i, { bonus: parseInt(e.target.value) || 0 }, true)}
                      style={{
                        width: 48, ...inputBase, textAlign: 'center',
                        MozAppearance: 'textfield',
                      } as React.CSSProperties}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Label>Domínio de Origem</Label>
            <select
              value={originDomain}
              onChange={e => { setOriginDomain(e.target.value); onUpdate({ domain_id: e.target.value }) }}
              style={selStyle}
            >
              <option value="">— Selecionar —</option>
              {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Fé / Divindade</Label>
            <select
              value={faith}
              onChange={e => { setFaith(e.target.value); onUpdate({ faith: e.target.value }) }}
              style={selStyle}
            >
              <option value="">— Selecionar —</option>
              {FAITHS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ── Seção 2: Histórico ─────────────────────────────────────────── */}
      <section className="worn-border" style={card}>
        <SectionHeading marker="✎" style={{ marginBottom: 14 }}>Histórico</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['concept',         'Conceito',           concept,    setConcept,    3],
            ['origin',          'Origem',             bgOrigin,   setBgOrigin,   3],
            ['backstory',       'História de Fundo',  backstory,  setBackstory,  6],
            ['traumaticEvents', 'Eventos Traumáticos',traumatic,  setTraumatic,  6],
          ] as [string, string, string, (v: string) => void, number][]).map(([field, label, val, setVal, rows]) => (
            <div key={field}>
              <Label>{label}</Label>
              <textarea
                rows={rows}
                value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={e => saveBg(field as Parameters<typeof saveBg>[0], e.target.value)}
                style={taStyle}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Seção 3: Relações e Conexões ───────────────────────────────── */}
      <section className="worn-border" style={card}>
        <SectionHeading marker="◈" style={{ marginBottom: 14 }}>Relações e Conexões</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

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
            <input
              type="text"
              value={faction}
              onChange={e => setFaction(e.target.value)}
              onBlur={e => saveRels(family, allies, rivals, e.target.value)}
              placeholder="Nome da facção…"
              maxLength={80}
              style={inputBase}
            />
          </div>
        </div>
      </section>

      {/* ── Seção 4: Impulsos ──────────────────────────────────────────── */}
      <section className="worn-border" style={card}>
        <SectionHeading marker="⚡" style={{ marginBottom: 14 }}>Impulsos</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['secrets',    'Segredos',  secrets,    setSecrets],
            ['flaws',      'Falhas',    flaws,      setFlaws],
            ['fears',      'Medos',     fears,      setFears],
            ['objectives', 'Objetivos', objectives, setObjectives],
          ] as [string, string, string, (v: string) => void][]).map(([field, label, val, setVal]) => (
            <div key={field}>
              <Label>{label}</Label>
              <textarea
                rows={4}
                value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={e => saveImp(field as Parameters<typeof saveImp>[0], e.target.value)}
                style={taStyle}
              />
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
